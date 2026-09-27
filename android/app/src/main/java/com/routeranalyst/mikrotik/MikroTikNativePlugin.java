package com.routeranalyst.mikrotik;

import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import javax.net.ssl.SSLSocketFactory;

@CapacitorPlugin(name = "MikroTikNative")
public class MikroTikNativePlugin extends Plugin {
    private static final String TAG = "MikroTikNative";

    private File getDataDir() {
        File dataDir = new File(getContext().getFilesDir(), "data");
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }
        return dataDir;
    }

    private File getBackupsDir() {
        File backupsDir = new File(getDataDir(), "backups");
        if (!backupsDir.exists()) {
            backupsDir.mkdirs();
        }
        return backupsDir;
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format(Locale.US, "%.1f %cB", bytes / Math.pow(1024, exp), pre);
    }

    // =========================================================================
    // ROUTEROS API PROTOCOL IMPLEMENTATION (Raw TCP Port 8728 / 8729)
    // =========================================================================

    private void writeLen(OutputStream out, int l) throws IOException {
        if (l < 0x80) {
            out.write(l);
        } else if (l < 0x4000) {
            l |= 0x8000;
            out.write((l >> 8) & 0xFF);
            out.write(l & 0xFF);
        } else if (l < 0x200000) {
            l |= 0xC00000;
            out.write((l >> 16) & 0xFF);
            out.write((l >> 8) & 0xFF);
            out.write(l & 0xFF);
        } else if (l < 0x10000000) {
            l |= 0xE0000000;
            out.write((l >> 24) & 0xFF);
            out.write((l >> 16) & 0xFF);
            out.write((l >> 8) & 0xFF);
            out.write(l & 0xFF);
        } else {
            out.write(0xF0);
            out.write((l >> 24) & 0xFF);
            out.write((l >> 16) & 0xFF);
            out.write((l >> 8) & 0xFF);
            out.write(l & 0xFF);
        }
    }

    private int readLen(InputStream in) throws IOException {
        int b = in.read();
        if (b == -1) return -1;
        if ((b & 0x80) == 0x00) {
            return b;
        } else if ((b & 0xC0) == 0x80) {
            int b2 = in.read();
            return ((b & 0x3F) << 8) | b2;
        } else if ((b & 0xE0) == 0xC0) {
            int b2 = in.read();
            int b3 = in.read();
            return ((b & 0x1F) << 16) | (b2 << 8) | b3;
        } else if ((b & 0xF0) == 0xE0) {
            int b2 = in.read();
            int b3 = in.read();
            int b4 = in.read();
            return ((b & 0x0F) << 24) | (b2 << 16) | (b3 << 8) | b4;
        } else if (b == 0xF0) {
            int b2 = in.read();
            int b3 = in.read();
            int b4 = in.read();
            int b5 = in.read();
            return (b2 << 24) | (b3 << 16) | (b4 << 8) | b5;
        }
        return b;
    }

    private void writeWord(OutputStream out, String word) throws IOException {
        byte[] bytes = word.getBytes(StandardCharsets.UTF_8);
        writeLen(out, bytes.length);
        out.write(bytes);
    }

    private String readWord(InputStream in) throws IOException {
        int len = readLen(in);
        if (len <= 0) return "";
        byte[] buf = new byte[len];
        int read = 0;
        while (read < len) {
            int r = in.read(buf, read, len - read);
            if (r == -1) break;
            read += r;
        }
        return new String(buf, 0, read, StandardCharsets.UTF_8);
    }

    private void writeSentence(OutputStream out, String... words) throws IOException {
        for (String w : words) {
            writeWord(out, w);
        }
        out.write(0);
        out.flush();
    }

    private List<String> readSentence(InputStream in) throws IOException {
        List<String> words = new ArrayList<>();
        while (true) {
            String w = readWord(in);
            if (w == null || w.isEmpty()) break;
            words.add(w);
        }
        return words;
    }

    private static byte[] hexStringToByteArray(String s) {
        int len = s.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                                 + Character.digit(s.charAt(i + 1), 16));
        }
        return data;
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String calculateMd5Response(String password, String challengeHex) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        md.update((byte) 0);
        md.update(password.getBytes(StandardCharsets.UTF_8));
        byte[] chalBytes = hexStringToByteArray(challengeHex);
        md.update(chalBytes);
        return "00" + bytesToHex(md.digest());
    }

    private Socket connectRouter(String host, int port, String user, String pass, boolean tls) throws Exception {
        Socket socket;
        if (tls) {
            socket = SSLSocketFactory.getDefault().createSocket(host, port);
        } else {
            socket = new Socket(host, port);
        }
        socket.setSoTimeout(7000);

        OutputStream out = socket.getOutputStream();
        InputStream in = socket.getInputStream();

        // 1. Initial Login query
        writeSentence(out, "/login", "=name=" + user, "=password=" + pass);
        List<String> res = readSentence(in);

        if (res.isEmpty()) {
            socket.close();
            throw new Exception("Router returned empty response on login.");
        }

        String status = res.get(0);
        if ("!trap".equals(status)) {
            String msg = "Login failed";
            for (String w : res) {
                if (w.startsWith("=message=")) msg = w.substring(9);
            }
            socket.close();
            throw new Exception(msg);
        }

        // Check if v6 challenge MD5 is required
        String challenge = null;
        for (String w : res) {
            if (w.startsWith("=ret=")) {
                challenge = w.substring(5);
                break;
            }
        }

        if (challenge != null && !challenge.isEmpty()) {
            String responseHex = calculateMd5Response(pass, challenge);
            writeSentence(out, "/login", "=name=" + user, "=response=" + responseHex);
            List<String> secondRes = readSentence(in);
            if (secondRes.isEmpty() || "!trap".equals(secondRes.get(0))) {
                String msg = "Authentication failed with router challenge.";
                for (String w : secondRes) {
                    if (w.startsWith("=message=")) msg = w.substring(9);
                }
                socket.close();
                throw new Exception(msg);
            }
        }

        return socket;
    }

    // =========================================================================
    // PLUGIN METHODS (Callable directly from React / JavaScript UI)
    // =========================================================================

    @PluginMethod
    public void testConnection(PluginCall call) {
        String host = call.getString("host", "").trim();
        int port = call.getInt("port", 8728);
        String user = call.getString("user", "").trim();
        String pass = call.getString("password", "");
        boolean tls = call.getBoolean("tls", false);

        if (host.isEmpty() || user.isEmpty()) {
            call.reject("Router IP and Username are required.");
            return;
        }

        long start = System.currentTimeMillis();
        new Thread(() -> {
            try {
                Socket socket = connectRouter(host, port, user, pass, tls);
                long latency = System.currentTimeMillis() - start;

                OutputStream out = socket.getOutputStream();
                InputStream in = socket.getInputStream();

                // Fetch identity
                writeSentence(out, "/system/identity/print");
                List<String> identitySentence = readSentence(in);
                String identity = "RouterOS";
                for (String w : identitySentence) {
                    if (w.startsWith("=name=")) identity = w.substring(6);
                }
                readSentence(in); // read !done

                // Fetch resources
                writeSentence(out, "/system/resource/print");
                List<String> resSentence = readSentence(in);
                String model = "MikroTik";
                String version = "v6.x";
                String cpuLoad = "N/A";
                String uptime = "N/A";
                String freeMemory = "N/A";

                for (String w : resSentence) {
                    if (w.startsWith("=board-name=")) model = w.substring(12);
                    else if (w.startsWith("=version=")) version = w.substring(9);
                    else if (w.startsWith("=cpu-load=")) cpuLoad = w.substring(10) + "%";
                    else if (w.startsWith("=uptime=")) uptime = w.substring(8);
                    else if (w.startsWith("=free-memory=")) {
                        try {
                            long bytes = Long.parseLong(w.substring(13));
                            freeMemory = (bytes / (1024 * 1024)) + " MB";
                        } catch (Exception ignored) {}
                    }
                }
                readSentence(in); // read !done

                socket.close();

                JSObject routerInfo = new JSObject();
                routerInfo.put("identity", identity);
                routerInfo.put("model", model);
                routerInfo.put("version", version);
                routerInfo.put("cpuLoad", cpuLoad);
                routerInfo.put("uptime", uptime);
                routerInfo.put("freeMemory", freeMemory);
                routerInfo.put("time", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(new Date()));

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("latency", latency + "ms");
                ret.put("routerInfo", routerInfo);
                call.resolve(ret);

            } catch (Exception e) {
                Log.e(TAG, "Test connection error: ", e);
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("error", e.getMessage() != null ? e.getMessage() : e.toString());
                call.resolve(ret);
            }
        }).start();
    }

    @PluginMethod
    public void syncDatabase(PluginCall call) {
        String host = call.getString("host", "").trim();
        int port = call.getInt("ftpPort", 21);
        String user = call.getString("user", "").trim();
        String pass = call.getString("password", "");
        String remotePath = call.getString("remotePath", "user-manager/sqldb");

        if (host.isEmpty() || user.isEmpty()) {
            call.reject("Router host and credentials are required for FTP download.");
            return;
        }

        new Thread(() -> {
            try {
                File targetFile = new File(getDataDir(), "userman_active.db");

                // Native Socket FTP implementation
                Socket cmdSocket = new Socket(host, port);
                cmdSocket.setSoTimeout(15000);
                BufferedReader reader = new BufferedReader(new InputStreamReader(cmdSocket.getInputStream()));
                PrintWriter writer = new PrintWriter(cmdSocket.getOutputStream(), true);

                reader.readLine(); // 220
                writer.println("USER " + user);
                reader.readLine();
                writer.println("PASS " + pass);
                String loginRes = reader.readLine();
                if (loginRes == null || !loginRes.startsWith("230")) {
                    cmdSocket.close();
                    throw new Exception("FTP Login failed: " + loginRes);
                }

                writer.println("TYPE I");
                reader.readLine();

                writer.println("PASV");
                String pasvLine = reader.readLine();
                int sIdx = pasvLine.indexOf('(');
                int eIdx = pasvLine.indexOf(')');
                String[] parts = pasvLine.substring(sIdx + 1, eIdx).split(",");
                String dataHost = parts[0] + "." + parts[1] + "." + parts[2] + "." + parts[3];
                int dataPort = (Integer.parseInt(parts[4]) << 8) + Integer.parseInt(parts[5]);

                Socket dataSocket = new Socket(dataHost, dataPort);
                dataSocket.setSoTimeout(20000);

                writer.println("RETR " + remotePath);
                reader.readLine(); // 150

                try (InputStream in = dataSocket.getInputStream();
                     FileOutputStream fos = new FileOutputStream(targetFile)) {
                    byte[] buffer = new byte[8192];
                    int len;
                    while ((len = in.read(buffer)) != -1) {
                        fos.write(buffer, 0, len);
                    }
                    fos.flush();
                }
                dataSocket.close();
                reader.readLine(); // 226

                writer.println("QUIT");
                cmdSocket.close();

                JSObject activeDb = new JSObject();
                activeDb.put("exists", true);
                activeDb.put("filename", "userman_active.db");
                activeDb.put("sizeBytes", targetFile.length());
                activeDb.put("sizeFormatted", formatBytes(targetFile.length()));
                activeDb.put("lastModified", new Date(targetFile.lastModified()).toString());

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("message", "Successfully downloaded user-manager/sqldb directly into mobile storage.");
                ret.put("activeDb", activeDb);
                call.resolve(ret);

            } catch (Exception e) {
                Log.e(TAG, "FTP Sync error: ", e);
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("error", e.getMessage() != null ? e.getMessage() : e.toString());
                call.resolve(ret);
            }
        }).start();
    }

    @PluginMethod
    public void getActiveDatabase(PluginCall call) {
        File file = new File(getDataDir(), "userman_active.db");
        JSObject activeDb = new JSObject();
        if (file.exists() && file.length() > 0) {
            activeDb.put("exists", true);
            activeDb.put("filename", "userman_active.db");
            activeDb.put("sizeBytes", file.length());
            activeDb.put("sizeFormatted", formatBytes(file.length()));
            activeDb.put("lastModified", new Date(file.lastModified()).toString());
        } else {
            activeDb.put("exists", false);
            activeDb.put("filename", "userman_active.db");
        }

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("activeDb", activeDb);
        call.resolve(ret);
    }

    @PluginMethod
    public void createBackup(PluginCall call) {
        File active = new File(getDataDir(), "userman_active.db");
        if (!active.exists()) {
            call.reject("Active database does not exist. Please sync from router first.");
            return;
        }

        try {
            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
            String backupName = "userman_" + timestamp + ".db";
            File backupFile = new File(getBackupsDir(), backupName);

            try (FileInputStream in = new FileInputStream(active);
                 FileOutputStream out = new FileOutputStream(backupFile)) {
                byte[] buf = new byte[8192];
                int r;
                while ((r = in.read(buf)) != -1) {
                    out.write(buf, 0, r);
                }
                out.flush();
            }

            JSObject bInfo = new JSObject();
            bInfo.put("filename", backupName);
            bInfo.put("backupFileName", backupName);
            bInfo.put("sizeBytes", backupFile.length());
            bInfo.put("sizeFormatted", formatBytes(backupFile.length()));
            bInfo.put("createdAt", new Date(backupFile.lastModified()).toString());

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("backup", bInfo);
            ret.put("backups", listBackupsInternal());
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Failed to create backup: " + e.getMessage());
        }
    }

    private JSArray listBackupsInternal() {
        JSArray arr = new JSArray();
        File[] files = getBackupsDir().listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.isFile() && f.getName().endsWith(".db")) {
                    JSObject item = new JSObject();
                    item.put("filename", f.getName());
                    item.put("sizeBytes", f.length());
                    item.put("sizeFormatted", formatBytes(f.length()));
                    item.put("lastModified", new Date(f.lastModified()).toString());
                    arr.put(item);
                }
            }
        }
        return arr;
    }

    @PluginMethod
    public void getBackups(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("backups", listBackupsInternal());
        call.resolve(ret);
    }

    @PluginMethod
    public void executeQuery(PluginCall call) {
        String sql = call.getString("sql", "");
        String dbName = call.getString("dbName", "userman_active.db");

        if (sql.trim().isEmpty()) {
            call.reject("SQL query cannot be empty.");
            return;
        }

        new Thread(() -> {
            File dbFile = new File(getDataDir(), dbName);
            if (!dbFile.exists()) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("error", "Database file " + dbName + " does not exist. Tap 'Reload & Replace Active sqldb' in Settings first.");
                call.resolve(ret);
                return;
            }

            SQLiteDatabase db = null;
            Cursor cursor = null;
            try {
                db = SQLiteDatabase.openDatabase(dbFile.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
                cursor = db.rawQuery(sql, null);
                String[] colNames = cursor.getColumnNames();

                JSArray cols = new JSArray();
                for (String c : colNames) {
                    cols.put(c);
                }

                JSArray rows = new JSArray();
                while (cursor.moveToNext()) {
                    JSObject row = new JSObject();
                    for (int i = 0; i < colNames.length; i++) {
                        String col = colNames[i];
                        int type = cursor.getType(i);
                        switch (type) {
                            case Cursor.FIELD_TYPE_NULL:
                                row.put(col, null);
                                break;
                            case Cursor.FIELD_TYPE_INTEGER:
                                row.put(col, cursor.getLong(i));
                                break;
                            case Cursor.FIELD_TYPE_FLOAT:
                                row.put(col, cursor.getDouble(i));
                                break;
                            case Cursor.FIELD_TYPE_STRING:
                                row.put(col, cursor.getString(i));
                                break;
                            case Cursor.FIELD_TYPE_BLOB:
                                byte[] blob = cursor.getBlob(i);
                                row.put(col, blob != null ? new String(blob, StandardCharsets.UTF_8) : null);
                                break;
                        }
                    }
                    rows.put(row);
                }

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("columns", cols);
                ret.put("rows", rows);
                ret.put("rowCount", rows.length());
                call.resolve(ret);

            } catch (Exception e) {
                Log.e(TAG, "SQL Query Error: ", e);
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("error", e.getMessage());
                call.resolve(ret);
            } finally {
                if (cursor != null) cursor.close();
                if (db != null) db.close();
            }
        }).start();
    }
}
