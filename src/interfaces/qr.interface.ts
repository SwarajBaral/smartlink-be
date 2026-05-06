export interface QRCard {
  id: string;
  qr_slug: string;

  business_name: string;
  owner_name: string;

  phone: string;
  email?: string;
  whatsapp_number?: string;
  google_maps_link?: string;
  upi_id?: string;
  youtube_link?: string;
  google_review_link?: string;

  website?: string;
  instagram?: string;
  facebook?: string;

  logo_url?: string;
  qr_image_base64?: string;

  enabled: boolean;

  created_at: string;
  updated_at: string;
}

export type QRCardCreate = Omit<QRCard, 'id' | 'created_at' | 'updated_at'>;

export type QRCardUpdate = Partial<
  Omit<QRCard, 'id' | 'qr_slug' | 'qr_image_base64' | 'created_at' | 'updated_at'>
>;

export interface PublicCardData {
  qr_slug: string;
  enabled: boolean;
  business_name: string;
  owner_name: string;
  phone: string;
  email?: string;
  whatsapp_number?: string;
  google_maps_link?: string;
  upi_id?: string;
  youtube_link?: string;
  google_review_link?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  logo_url?: string;
}
