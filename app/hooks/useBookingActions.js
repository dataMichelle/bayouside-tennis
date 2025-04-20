// app/lib/useBookingActions.js (already correct)
import { useEffect, useState } from "react";
import {
  getAllCoaches,
  getAllBookings,
  getSettings,
} from "@/lib/mongodb-queries";

const useBookingLogic = () => {
  const [coaches, setCoaches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [settings, setSettings] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [coachesData, bookingsData, settingsData] = await Promise.all([
          getAllCoaches(),
          getAllBookings(),
          getSettings(),
        ]);
        setCoaches(coachesData);
        setBookings(bookingsData);
        setSettings(settingsData);
      } catch (err) {
        console.error("Error loading booking data:", err);
        setError("Failed to load data.");
      }
    };
    fetchInitialData();
  }, []);

  return { coaches, bookings, settings, error };
};

export default useBookingLogic;
