"use client";
import { useEffect, useState, useCallback } from "react";
import { getAllCoaches, getSettings } from "@/lib/mongodb-queries";

const useBookingLogic = (userId) => {
  const [coaches, setCoaches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [settings, setSettings] = useState({});
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`/api/player/reservations?playerId=${userId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Error fetching player bookings:", err);
      setBookings([]);
      setError("Failed to fetch bookings.");
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const fetchAll = async () => {
      try {
        const [coachesData, settingsData] = await Promise.all([
          getAllCoaches(),
          getSettings(),
        ]);
        setCoaches(coachesData);
        setSettings(settingsData);
        await fetchBookings();
      } catch (err) {
        console.error("Error loading booking logic:", err);
        setError("Failed to load data.");
      }
    };

    fetchAll();
  }, [userId, fetchBookings]);

  return {
    coaches,
    bookings,
    settings,
    error,
    refreshBookings: fetchBookings, // allows manual refresh after payment
  };
};

export default useBookingLogic;
