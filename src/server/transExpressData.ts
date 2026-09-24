/**
 * Trans Express Sri Lanka Location Reference & Resilient Cache
 * Standard Sri Lankan Provinces, Districts, and Cities
 */

export interface Province {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
  province_id: number;
}

export interface City {
  id: number;
  name: string;
  district_id: number;
  postcode?: string;
}

export const SRI_LANKA_PROVINCES: Province[] = [
  { id: 1, name: 'Western Province' },
  { id: 2, name: 'Central Province' },
  { id: 3, name: 'Southern Province' },
  { id: 4, name: 'North Western Province' },
  { id: 5, name: 'Sabaragamuwa Province' },
  { id: 6, name: 'Eastern Province' },
  { id: 7, name: 'Uva Province' },
  { id: 8, name: 'North Central Province' },
  { id: 9, name: 'Northern Province' },
];

export const SRI_LANKA_DISTRICTS: District[] = [
  // Western Province
  { id: 1, name: 'Colombo', province_id: 1 },
  { id: 2, name: 'Gampaha', province_id: 1 },
  { id: 3, name: 'Kalutara', province_id: 1 },
  // Central Province
  { id: 4, name: 'Kandy', province_id: 2 },
  { id: 5, name: 'Matale', province_id: 2 },
  { id: 6, name: 'Nuwara Eliya', province_id: 2 },
  // Southern Province
  { id: 7, name: 'Galle', province_id: 3 },
  { id: 8, name: 'Matara', province_id: 3 },
  { id: 9, name: 'Hambantota', province_id: 3 },
  // North Western Province
  { id: 10, name: 'Kurunegala', province_id: 4 },
  { id: 11, name: 'Puttalam', province_id: 4 },
  // Sabaragamuwa Province
  { id: 12, name: 'Ratnapura', province_id: 5 },
  { id: 13, name: 'Kegalle', province_id: 5 },
  // Eastern Province
  { id: 14, name: 'Batticaloa', province_id: 6 },
  { id: 15, name: 'Ampara', province_id: 6 },
  { id: 16, name: 'Trincomalee', province_id: 6 },
  // Uva Province
  { id: 17, name: 'Badulla', province_id: 7 },
  { id: 18, name: 'Monaragala', province_id: 7 },
  // North Central Province
  { id: 19, name: 'Anuradhapura', province_id: 8 },
  { id: 20, name: 'Polonnaruwa', province_id: 8 },
  // Northern Province
  { id: 21, name: 'Jaffna', province_id: 9 },
  { id: 22, name: 'Kilinochchi', province_id: 9 },
  { id: 23, name: 'Mannar', province_id: 9 },
  { id: 24, name: 'Vavuniya', province_id: 9 },
  { id: 25, name: 'Mullaitivu', province_id: 9 },
];

export const SRI_LANKA_CITIES: City[] = [
  // Colombo District
  { id: 101, name: 'Colombo 01 (Fort)', district_id: 1, postcode: '00100' },
  { id: 102, name: 'Colombo 02 (Slave Island)', district_id: 1, postcode: '00200' },
  { id: 103, name: 'Colombo 03 (Kollupitiya)', district_id: 1, postcode: '00300' },
  { id: 104, name: 'Colombo 04 (Bambalapitiya)', district_id: 1, postcode: '00400' },
  { id: 105, name: 'Colombo 05 (Havelock / Kirulapone)', district_id: 1, postcode: '00500' },
  { id: 106, name: 'Colombo 06 (Wellawatte)', district_id: 1, postcode: '00600' },
  { id: 107, name: 'Colombo 07 (Cinnamon Gardens)', district_id: 1, postcode: '00700' },
  { id: 108, name: 'Colombo 08 (Borella)', district_id: 1, postcode: '00800' },
  { id: 109, name: 'Dehiwala', district_id: 1, postcode: '10350' },
  { id: 110, name: 'Mount Lavinia', district_id: 1, postcode: '10370' },
  { id: 111, name: 'Nugegoda', district_id: 1, postcode: '10250' },
  { id: 112, name: 'Maharagama', district_id: 1, postcode: '10280' },
  { id: 113, name: 'Kotte / Rajagiriya', district_id: 1, postcode: '10100' },
  { id: 114, name: 'Battaramulla', district_id: 1, postcode: '10120' },
  { id: 115, name: 'Moratuwa', district_id: 1, postcode: '10400' },
  { id: 116, name: 'Kaduwela', district_id: 1, postcode: '10640' },
  { id: 117, name: 'Pannipitiya', district_id: 1, postcode: '10230' },
  { id: 118, name: 'Homagama', district_id: 1, postcode: '10200' },
  { id: 119, name: 'Malabe', district_id: 1, postcode: '10115' },
  { id: 120, name: 'Piliyandala', district_id: 1, postcode: '10300' },

  // Gampaha District
  { id: 201, name: 'Gampaha', district_id: 2, postcode: '11000' },
  { id: 202, name: 'Negombo', district_id: 2, postcode: '11500' },
  { id: 203, name: 'Kelaniya', district_id: 2, postcode: '11600' },
  { id: 204, name: 'Wattala', district_id: 2, postcode: '11300' },
  { id: 205, name: 'Ja-Ela', district_id: 2, postcode: '11350' },
  { id: 206, name: 'Kadawatha', district_id: 2, postcode: '11850' },
  { id: 207, name: 'Kiribathgoda', district_id: 2, postcode: '11600' },
  { id: 208, name: 'Biyagama', district_id: 2, postcode: '11650' },
  { id: 209, name: 'Minuwangoda', district_id: 2, postcode: '11550' },

  // Kalutara District
  { id: 301, name: 'Kalutara', district_id: 3, postcode: '12000' },
  { id: 302, name: 'Panadura', district_id: 3, postcode: '12500' },
  { id: 303, name: 'Horana', district_id: 3, postcode: '12400' },
  { id: 304, name: 'Beruwala', district_id: 3, postcode: '12070' },
  { id: 305, name: 'Aluthgama', district_id: 3, postcode: '12080' },

  // Kandy District
  { id: 401, name: 'Kandy City', district_id: 4, postcode: '20000' },
  { id: 402, name: 'Peradeniya', district_id: 4, postcode: '20400' },
  { id: 403, name: 'Katugastota', district_id: 4, postcode: '20120' },
  { id: 404, name: 'Gampola', district_id: 4, postcode: '20500' },
  { id: 405, name: 'Kundasale', district_id: 4, postcode: '20168' },

  // Galle District
  { id: 701, name: 'Galle Fort / City', district_id: 7, postcode: '80000' },
  { id: 702, name: 'Hikkaduwa', district_id: 7, postcode: '80240' },
  { id: 703, name: 'Karapitiya', district_id: 7, postcode: '80000' },
  { id: 704, name: 'Ambalangoda', district_id: 7, postcode: '80300' },

  // Kurunegala District
  { id: 1001, name: 'Kurunegala Town', district_id: 10, postcode: '60000' },
  { id: 1002, name: 'Kuliyapitiya', district_id: 10, postcode: '60200' },
  { id: 1003, name: 'Wariyapola', district_id: 10, postcode: '60400' },
];
