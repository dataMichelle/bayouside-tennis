"use client";

import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentProvider, usePayment } from "@/context/PaymentContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import PageContainer from "@/components/PageContainer";
import BookingForm from "@/components/BookingForm";
import BookingModals from "@/components/BookingModals"; // matches the new unified file
import useBookingLogic from "@/hooks/useBookingActions"; // assuming logic was extracted

export function BookingContent() {
  const { user, loading: authLoading } = useRequireAuth();
  const {
    coaches,
    bookings,
    settings,
    selectedCoach,
    setSelectedCoach,
    selectedSlots,
    setSelectedSlots,
    calendarDate,
    setCalendarDate,
    handleDateClick,
    tileContent,
    ballMachine,
    setBallMachine,
    handleBookingOpen,
    handleLogout,
    modalOpen,
    paymentModalOpen,
    slotModalOpen,
    setModalOpen,
    setPaymentModalOpen,
    setSlotModalOpen,
    selectedDaySlots,
    currentDay,
    handleSlotToggle,
    confirmSlotSelection,
    calculateCostBreakdown,
    handleBookingConfirm,
    handlePaymentConfirm,
    paymentError,
    isProcessing,
    error,
  } = useBookingLogic(); // custom hook to manage logic (optional)

  if (authLoading) return <div className="text-center p-6">Loading...</div>;
  if (!user)
    return <div className="text-center p-6">Please log in to book.</div>;
  if (error)
    return <div className="text-center p-6 text-red-500">Error: {error}</div>;

  return (
    <PageContainer title="Booking Page">
      <BookingForm
        coaches={coaches}
        selectedCoach={selectedCoach}
        setSelectedCoach={setSelectedCoach}
        selectedSlots={selectedSlots}
        setSelectedSlots={setSelectedSlots}
        tileContent={tileContent}
        calendarDate={calendarDate}
        setCalendarDate={setCalendarDate}
        handleDateClick={handleDateClick}
        formatTimeTo12HourCDT={(time) => {
          const date = new Date(time);
          return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "America/Chicago",
          });
        }}
        ballMachine={ballMachine}
        setBallMachine={setBallMachine}
        handleBookingOpen={() => setModalOpen(true)}
        handleLogout={handleLogout}
      />

      <BookingModals
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        paymentModalOpen={paymentModalOpen}
        setPaymentModalOpen={setPaymentModalOpen}
        slotModalOpen={slotModalOpen}
        setSlotModalOpen={setSlotModalOpen}
        selectedSlots={selectedSlots}
        selectedDaySlots={selectedDaySlots}
        currentDay={currentDay}
        handleSlotToggle={handleSlotToggle}
        confirmSlotSelection={confirmSlotSelection}
        handleBookingConfirm={handleBookingConfirm}
        handlePaymentConfirm={handlePaymentConfirm}
        calculateCostBreakdown={calculateCostBreakdown}
        coaches={coaches}
        selectedCoach={selectedCoach}
        ballMachine={ballMachine}
        paymentError={paymentError}
        isProcessing={isProcessing}
      />
    </PageContainer>
  );
}

export default function BookingPage() {
  return (
    <PaymentProvider>
      <BookingContent />
    </PaymentProvider>
  );
}
