package com.linklite.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import org.springframework.stereotype.Service;

@Service
public class QrCodeService {

    public String generatePngDataUrl(String value) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, 280, 280);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(outputStream.toByteArray());
        } catch (Exception exception) {
            return "";
        }
    }
}
