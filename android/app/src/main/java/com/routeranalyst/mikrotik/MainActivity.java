package com.routeranalyst.mikrotik;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MikroTikNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
