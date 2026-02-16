import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

export const labourLinePricing = [
  // --- CATEGORY 1: CONSTRUCTION ---
  {
    id: "1",
    label: "Construction & Infrastructure",
    color: "#FF4757",
    subCategories: [
      {
        id: "c1",
        label: "Mason (Mistri)",
        value: "mason",
        pricing: {
          model: "shift",
          rates: {
            fullDay: 900, // 8 hours
            halfDay: 500, // 4 hours
            overtimePerHour: 150,
          },
        },
      },
      {
        id: "c2",
        label: "Construction Helper (Bigari)",
        value: "helper",
        pricing: {
          model: "shift",
          rates: {
            fullDay: 600,
            halfDay: 350,
            overtimePerHour: 100,
          },
        },
      },
      {
        id: "c5",
        label: "Tile & Marble Fitter",
        value: "tile_fitter",
        pricing: {
          model: "measurement",
          unit: "sq_ft",
          baseRate: 35, // ₹35 per sq. ft.
          minJobValue: 500, // Minimum work required
        },
      },
      {
        id: "c6",
        label: "Painter",
        value: "painter",
        pricing: {
          model: "measurement",
          unit: "sq_ft",
          baseRate: 12, // ₹12 per sq. ft. (Single coat)
          minJobValue: 1000,
        },
      },
      {
        id: "c7",
        label: "Plumber",
        value: "plumber",
        pricing: {
          model: "task_based",
          visitCharge: 150, // Paid if no work done
          rateCard: [
            { item: "Tap Repair/Change", price: 150 },
            { item: "Leakage Fix (Basic)", price: 250 },
            { item: "Wash Basin Installation", price: 600 },
            { item: "Water Tank Cleaning", price: 800 },
            { item: "Full Day Labour", price: 1000 },
          ],
        },
      },
      {
        id: "c8",
        label: "Electrician",
        value: "electrician",
        pricing: {
          model: "task_based",
          visitCharge: 150,
          rateCard: [
            { item: "Fan Installation", price: 200 },
            { item: "Switch/Socket Repair", price: 80 },
            { item: "Tube Light / Bulb Holder", price: 100 },
            { item: "Inverter Connection", price: 450 },
            { item: "Full Day Labour", price: 1000 },
          ],
        },
      },
    ],
  },

  // --- CATEGORY 2: AGRICULTURE ---
  {
    id: "2",
    label: "Agriculture",
    color: "#FF9F43",
    subCategories: [
      {
        id: "a1",
        label: "Sowing / Weeding / General Farm Work",
        value: "farm_labour",
        pricing: {
          model: "shift",
          rates: {
            fullDay: 450,
            halfDay: 300,
            overtimePerHour: 80,
          },
        },
      },
      {
        id: "a3",
        label: "Pesticide Spraying",
        value: "spraying",
        pricing: {
          model: "measurement",
          unit: "acre", // Per Acre rate
          baseRate: 400,
          minJobValue: 400,
        },
      },
      {
        id: "a4",
        label: "Tractor Driver",
        value: "tractor_driver",
        pricing: {
          model: "shift",
          rates: {
            fullDay: 700,
            halfDay: 400,
            overtimePerHour: 100,
          },
        },
      },
    ],
  },

  // --- CATEGORY 3: TRANSPORT ---
  {
    id: "3",
    label: "Transportation / Loading",
    color: "#D980FA",
    subCategories: [
      {
        id: "t1",
        label: "Truck Loader / Unloader",
        value: "loader",
        pricing: {
          model: "shift", // Can also be per-item, but shift is safer for Stage 1
          rates: {
            fullDay: 700,
            halfDay: 400,
            overtimePerHour: 120,
          },
        },
      },
      {
        id: "t5",
        label: "Tempo / Driver",
        value: "driver",
        pricing: {
          model: "distance_time",
          baseFare: 500, // Includes first 5km or 2 hours
          perKmRate: 25,
          waitingChargePerHour: 100,
        },
      },
    ],
  },

  // --- CATEGORY 5: CLEANING ---
  {
    id: "5",
    label: "Cleaning & Maintenance",
    color: "#9C88FF",
    subCategories: [
      {
        id: "cl1",
        label: "Housekeeping / Deep Cleaning",
        value: "housekeeping",
        pricing: {
          model: "shift",
          rates: {
            fullDay: 500,
            halfDay: 300,
            overtimePerHour: 80,
          },
        },
      },
      {
        id: "cl4",
        label: "Septic Tank Cleaner",
        value: "septic_cleaner",
        pricing: {
          model: "task_based",
          visitCharge: 200,
          rateCard: [
            { item: "Small Tank (Residential)", price: 1500 },
            { item: "Large Tank (Commercial)", price: 2500 },
          ],
        },
      },
    ],
  },

  // --- CATEGORY 7: DOMESTIC (SPECIAL CASE) ---
  {
    id: "7",
    label: "Domestic & Household",
    color: "#00CEC9",
    subCategories: [
      {
        id: "d1",
        label: "Maid / Cook / Nanny",
        value: "domestic_help",
        pricing: {
          model: "trial_subscription",
          trialRate: 300, // One-day trial price
          monthlySubscriptionEstimates: {
            cleaning: 1500, // Per month for 1 hour daily
            cooking: 3000, // Per month for 2 meals
            full_day: 12000, // Full day 9-5
          },
        },
      },
    ],
  },
];

export const workCategories = [
  {
    id: "1",
    label: "Construction & Infrastructure",
    color: "#FF4757", // Red
    subCategories: [
      { id: "c1", label: "Mason (Mistri)", value: "mason" },
      { id: "c2", label: "Construction Helper (Bigari)", value: "helper" },
      { id: "c3", label: "Centering / Shuttering", value: "centering" },
      { id: "c4", label: "Steel Binder (Saliya)", value: "steel_binder" },
      { id: "c5", label: "Tile & Marble Fitter", value: "tile_fitter" },
      { id: "c6", label: "Painter", value: "painter" },
      { id: "c7", label: "Plumber", value: "plumber" },
      { id: "c8", label: "Electrician", value: "electrician" },
      { id: "c9", label: "Welder", value: "welder" },
      { id: "c10", label: "POP / False Ceiling", value: "pop_work" },
    ],
  },
  {
    id: "2",
    label: "Agriculture",
    color: "#FF9F43", // Orange
    subCategories: [
      { id: "a1", label: "Sowing (Perni)", value: "sowing" },
      { id: "a2", label: "Harvesting (Kapni)", value: "harvesting" },
      { id: "a3", label: "Pesticide Spraying", value: "spraying" },
      { id: "a4", label: "Tractor Driver", value: "tractor_driver" },
      { id: "a5", label: "Fruit Picking", value: "fruit_picking" },
      { id: "a6", label: "Irrigation Helper", value: "irrigation" },
      { id: "a7", label: "Weeding (Nindani)", value: "weeding" },
    ],
  },
  {
    id: "3",
    label: "Transportation / Loading",
    color: "#D980FA", // Lilac
    subCategories: [
      { id: "t1", label: "Truck Loader / Unloader", value: "loader" },
      { id: "t2", label: "Packers & Movers Helper", value: "packer_mover" },
      { id: "t3", label: "Warehouse Helper", value: "warehouse" },
      { id: "t4", label: "Delivery Boy", value: "delivery" },
      { id: "t5", label: "Tempo / Driver", value: "driver" },
    ],
  },
  {
    id: "4",
    label: "Factory & Industrial",
    color: "#FBC531", // Yellow
    subCategories: [
      { id: "f1", label: "Packaging", value: "packaging" },
      { id: "f2", label: "Machine Operator", value: "machine_op" },
      { id: "f3", label: "Assembly Line Worker", value: "assembly" },
      { id: "f4", label: "Helper / Labour", value: "factory_helper" },
      { id: "f5", label: "Sorting / Grading", value: "sorting" },
      { id: "f6", label: "Textile / Garment Worker", value: "textile" },
    ],
  },
  {
    id: "5",
    label: "Cleaning & Maintenance",
    color: "#9C88FF", // Periwinkle
    subCategories: [
      { id: "cl1", label: "Housekeeping", value: "housekeeping" },
      { id: "cl2", label: "Office Boy / Peon", value: "office_boy" },
      { id: "cl3", label: "Street / Society Sweeper", value: "sweeper" },
      { id: "cl4", label: "Septic Tank Cleaner", value: "septic_cleaner" },
      { id: "cl5", label: "Window / Glass Cleaner", value: "glass_cleaner" },
    ],
  },
  {
    id: "6",
    label: "Mining & Quarry",
    color: "#8BC34A", // Green
    subCategories: [
      { id: "m1", label: "Stone Breaker", value: "stone_breaker" },
      { id: "m2", label: "Quarry Worker", value: "quarry_worker" },
      { id: "m3", label: "Drilling Helper", value: "drilling" },
      { id: "m4", label: "Earth Mover Helper", value: "earth_mover" },
    ],
  },
  {
    id: "7",
    label: "Domestic & Household",
    color: "#00CEC9", // Teal
    subCategories: [
      { id: "d1", label: "Maid (Cleaning/Washing)", value: "maid" },
      { id: "d2", label: "Cook", value: "cook" },
      { id: "d3", label: "Babysitter / Nanny", value: "nanny" },
      { id: "d4", label: "Elderly Care", value: "elderly_care" },
      { id: "d5", label: "Watchman / Security", value: "security" },
      { id: "d6", label: "Gardener (Mali)", value: "gardener" },
    ],
  },
];

export const uploadToImgBB = async (uri) => {
  if (!uri) return null;

  const API_KEY = "fc50074e638d1229006be871defcb3b5"; // Replace with your actual ImgBB API Key
  const formData = new FormData();

  // ImgBB expects the field name to be 'image'
  formData.append("image", {
    uri: uri,
    type: "image/jpeg",
    name: "upload.jpg",
  });

  try {
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${API_KEY}`,
      {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const data = await response.json();
    if (data.success) {
      console.log("ImgBB Success URL:", data.data.url);
      return data.data.url; // This is the direct link for your DB
    } else {
      console.error("ImgBB Error:", data);
      return null;
    }
  } catch (error) {
    console.error("ImgBB Fetch Error:", error);
    return null;
  }
};

export const filterData = {
  main: [
    { id: "1", label: "Category", type: "category", color: "#0D47A1" },
    { id: "2", label: "Distance", type: "distance", color: "#FF9F43" },
    { id: "3", label: "Earning", type: "price", color: "#2ecc71" },
  ],
  distance: [
    { id: "d1", label: "Within 5 km", value: 5, color: "#FF9F43" },
    { id: "d2", label: "Within 10 km", value: 10, color: "#FF9F43" },
    { id: "d3", label: "Within 20 km", value: 20, color: "#FF9F43" },
  ],
  price: [
    { id: "p1", label: "Above ₹1000", value: 1000, color: "#2ecc71" },
    { id: "p2", label: "Above ₹2000", value: 2000, color: "#2ecc71" },
    { id: "p3", label: "Above ₹3000", value: 3000, color: "#2ecc71" },
  ],
};

export const acceptWorkApi = async (workId) => {
  console.log(workId);
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated");

    const decoded = jwtDecode(token);
    const labourId = decoded.id;

    const API_URL = `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/labour/accept-work?labourId=${labourId}&workId=${workId}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Could not accept work.");
    }

    return await response.json();
  } catch (error) {
    console.error("Generalized Accept Work Error:", error);
    throw error;
  }
};
