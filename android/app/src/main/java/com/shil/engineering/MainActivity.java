package com.shil.engineering;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShilExportPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
