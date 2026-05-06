import QRCode from 'qrcode';

export async function generateQRImage(url: string): Promise<string> {
  // Use SVG renderer — avoids canvas dependency which is unavailable in CF Workers
  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
