import QRCode from 'qrcode';

// With async/await
export const generateQR = async (text: string): Promise<string> => {
  try {
    const qrCode = await QRCode.toDataURL(text);
    return qrCode;
  } catch (err: any) {
    console.error(err);
    return err;
  }
};

export const getStationName = (id: number): string => {
  switch (id) {
    case 1:
      return 'Assembly Line';
    case 2:
      return 'Assembly Store';
    case 3:
      return 'Fabrication';
    default:
      return 'Unknown';
  }
};