import { BookingComHotelsScraper } from './nodes/BookingComHotelsScraper/BookingComHotelsScraper.node';
import { ApifyApi } from './credentials/ApifyApi.credentials';

export const nodeTypes = [BookingComHotelsScraper];

export const credentialTypes = [ApifyApi];
