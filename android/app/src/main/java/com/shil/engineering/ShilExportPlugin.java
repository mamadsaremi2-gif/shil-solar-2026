package com.shil.engineering;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "ShilExport")
public class ShilExportPlugin extends Plugin {

    private byte[] decode(String base64) {
        return Base64.decode(base64, Base64.DEFAULT);
    }

    private String safeName(String filename) {
        String name = filename == null || filename.trim().isEmpty() ? "shil-export.bin" : filename.trim();
        return name.replaceAll("[\\\\/:*?\"<>|]", "-");
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        String base64 = call.getString("base64");
        String filename = safeName(call.getString("filename"));
        String mimeType = call.getString("mimeType", "application/octet-stream");
        if (base64 == null || base64.isEmpty()) {
            call.reject("Export data is empty");
            return;
        }

        try {
            byte[] bytes = decode(base64);
            Uri uri;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/SHIL");
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("Unable to create Downloads file");
                try (OutputStream out = resolver.openOutputStream(uri)) {
                    if (out == null) throw new IllegalStateException("Unable to open Downloads file");
                    out.write(bytes);
                    out.flush();
                }
                values.clear();
                values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                resolver.update(uri, values, null, null);
            } else {
                File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) dir = getContext().getFilesDir();
                File shilDir = new File(dir, "SHIL");
                if (!shilDir.exists() && !shilDir.mkdirs()) throw new IllegalStateException("Unable to create export directory");
                File file = new File(shilDir, filename);
                try (FileOutputStream out = new FileOutputStream(file)) {
                    out.write(bytes);
                    out.flush();
                }
                uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            }

            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            result.put("filename", filename);
            result.put("mimeType", mimeType);
            result.put("size", bytes.length);
            result.put("location", Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? "Downloads/SHIL" : "App Downloads/SHIL");
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Native save failed: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void shareFile(PluginCall call) {
        String base64 = call.getString("base64");
        String filename = safeName(call.getString("filename"));
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String title = call.getString("title", "SHIL");
        if (base64 == null || base64.isEmpty()) {
            call.reject("Export data is empty");
            return;
        }

        try {
            byte[] bytes = decode(base64);
            File shareDir = new File(getContext().getCacheDir(), "shil-share");
            if (!shareDir.exists() && !shareDir.mkdirs()) throw new IllegalStateException("Unable to create share cache");
            File file = new File(shareDir, filename);
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(bytes);
                out.flush();
            }

            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType(mimeType);
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.putExtra(Intent.EXTRA_SUBJECT, title);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(intent, title);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);

            JSObject result = new JSObject();
            result.put("uri", uri.toString());
            result.put("filename", filename);
            result.put("size", bytes.length);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Native share failed: " + error.getMessage(), error);
        }
    }
}
