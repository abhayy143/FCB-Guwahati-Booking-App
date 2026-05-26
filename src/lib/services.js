import { db, storage } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc, 
  query, 
  orderBy, 
  runTransaction,
  serverTimestamp,
  where,
  deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ==========================================
// STORAGE SERVICES
// ==========================================

/**
 * Uploads a file to Firebase Storage and returns the download URL
 * @param {File} file - The file to upload
 * @param {string} folder - Folder name ('banners' or 'screenshots')
 * @returns {Promise<string>} Download URL
 */
export const uploadFile = async (file, folder) => {
  if (!file) return "";
  try {
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const fileRef = ref(storage, `${folder}/${filename}`);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file to storage:", error);
    throw new Error("Failed to upload image. Please try again.");
  }
};

// ==========================================
// EVENTS SERVICES
// ==========================================

/**
 * Fetches all events from Firestore sorted by date
 * @returns {Promise<Array>} List of events
 */
export const fetchEvents = async () => {
  try {
    const eventsCol = collection(db, "events");
    const q = query(eventsCol, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    const events = [];
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() });
    });
    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

/**
 * Fetches a single event by ID
 * @param {string} id - Event ID
 * @returns {Promise<Object|null>} Event data or null
 */
export const fetchEventById = async (id) => {
  try {
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new event in Firestore (Admin)
 * @param {Object} eventData - Event details
 * @returns {Promise<string>} New Event ID
 */
export const createEvent = async (eventData) => {
  try {
    const eventsCol = collection(db, "events");
    // Generate a new document reference with an auto ID
    const newEventRef = doc(eventsCol);
    const data = {
      title: eventData.title,
      type: eventData.type, // 'screening' | 'turf'
      description: eventData.description,
      venue: eventData.venue,
      date: eventData.date, // YYYY-MM-DD
      time: eventData.time, // HH:MM
      bannerImage: eventData.bannerImage || "",
      price: Number(eventData.price),
      maxSeats: Number(eventData.maxSeats),
      remainingSeats: Number(eventData.maxSeats),
      createdAt: new Date().toISOString()
    };
    await setDoc(newEventRef, data);
    return newEventRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

// ==========================================
// BOOKINGS SERVICES
// ==========================================

/**
 * Creates a booking and decrements event remaining seats in a transaction
 * @param {Object} bookingData - Booking details
 * @returns {Promise<string>} Created booking ID
 */
export const createBooking = async (bookingData) => {
  try {
    const bookingsCol = collection(db, "bookings");
    const newBookingRef = doc(bookingsCol);
    const ticketsCount = Number(bookingData.numberOfTickets);

    // Bypass transaction-safe seat updating for mock/demo events
    if (bookingData.eventId.startsWith("mock-")) {
      const bookingPayload = {
        eventId: bookingData.eventId,
        eventTitle: bookingData.eventTitle || "Demo Event",
        userId: bookingData.userId || "",
        userName: bookingData.userName,
        phoneNumber: bookingData.phoneNumber,
        numberOfTickets: ticketsCount,
        totalAmount: Number(bookingData.totalAmount),
        utrNumber: bookingData.utrNumber,
        screenshotUrl: bookingData.screenshotUrl || "",
        bookingStatus: "pending",
        createdAt: new Date().toISOString()
      };
      await setDoc(newBookingRef, bookingPayload);
      return newBookingRef.id;
    }

    const eventRef = doc(db, "events", bookingData.eventId);

    await runTransaction(db, async (transaction) => {
      // 1. Read event first
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error("Event does not exist.");
      }

      const eventData = eventDoc.data();
      const currentRemaining = Number(eventData.remainingSeats || 0);

      // 2. Check seat availability
      if (currentRemaining < ticketsCount) {
        throw new Error(`Only ${currentRemaining} seat(s) remaining for this event.`);
      }

      // 3. Write booking
      const bookingPayload = {
        eventId: bookingData.eventId,
        eventTitle: eventData.title,
        userId: bookingData.userId || "",
        userName: bookingData.userName,
        phoneNumber: bookingData.phoneNumber,
        numberOfTickets: ticketsCount,
        totalAmount: Number(bookingData.totalAmount),
        utrNumber: bookingData.utrNumber,
        screenshotUrl: bookingData.screenshotUrl || "",
        bookingStatus: "pending",
        createdAt: new Date().toISOString()
      };
      
      transaction.set(newBookingRef, bookingPayload);

      // 4. Update event remaining seats
      transaction.update(eventRef, {
        remainingSeats: currentRemaining - ticketsCount
      });
    });

    return newBookingRef.id;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

/**
 * Fetches all bookings sorted by createdAt descending
 * @returns {Promise<Array>} List of bookings
 */
export const fetchAllBookings = async () => {
  try {
    const bookingsCol = collection(db, "bookings");
    const q = query(bookingsCol, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    return bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

/**
 * Updates a booking's status and adjusts event remaining seats if rejected
 * @param {string} bookingId - Booking Document ID
 * @param {string} newStatus - 'confirmed' | 'rejected'
 * @returns {Promise<void>}
 */
export const updateBookingStatus = async (bookingId, newStatus) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    
    await runTransaction(db, async (transaction) => {
      // 1. Get booking info
      const bookingDoc = await transaction.get(bookingRef);
      if (!bookingDoc.exists()) {
        throw new Error("Booking does not exist.");
      }

      const bookingData = bookingDoc.data();
      const currentStatus = bookingData.bookingStatus;
      const ticketsCount = Number(bookingData.numberOfTickets);
      const eventId = bookingData.eventId;

      // If the status is not changing, do nothing
      if (currentStatus === newStatus) return;

      // Bypass event updates if booking is associated with a mock/demo event
      if (eventId.startsWith("mock-")) {
        transaction.update(bookingRef, {
          bookingStatus: newStatus
        });
        return;
      }

      const eventRef = doc(db, "events", eventId);

      // 2. Read event info
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error("Associated event does not exist.");
      }
      
      const eventData = eventDoc.data();
      const currentRemaining = Number(eventData.remainingSeats || 0);

      // 3. Status logic
      if (newStatus === "rejected" && (currentStatus === "pending" || currentStatus === "confirmed")) {
        // Increment seats back
        transaction.update(eventRef, {
          remainingSeats: currentRemaining + ticketsCount
        });
      } else if (newStatus === "confirmed" && currentStatus === "rejected") {
        // Re-decrement seats
        if (currentRemaining < ticketsCount) {
          throw new Error(`Cannot confirm. Only ${currentRemaining} seat(s) remaining for this event.`);
        }
        transaction.update(eventRef, {
          remainingSeats: currentRemaining - ticketsCount
        });
      }

      // 4. Update booking status
      transaction.update(bookingRef, {
        bookingStatus: newStatus
      });
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

/**
 * Fetches a single booking by ID
 * @param {string} bookingId - Booking Document ID
 * @returns {Promise<Object|null>} Booking data or null
 */
export const fetchBookingById = async (bookingId) => {
  try {
    const docRef = doc(db, "bookings", bookingId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching booking ${bookingId}:`, error);
    throw error;
  }
};

export const fetchUserBookings = async (userId) => {
  try {
    const bookingsCol = collection(db, "bookings");
    const q = query(bookingsCol, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const userBookings = [];
    querySnapshot.forEach((doc) => {
      userBookings.push({ id: doc.id, ...doc.data() });
    });
    // Sort client-side by createdAt descending to avoid composite index requirements
    userBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return userBookings;
  } catch (error) {
    console.error(`Error fetching bookings for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Persists user profile information (Name, Phone number) in Firestore
 * @param {string} uid - Firebase Auth User UID
 * @param {Object} userData - { name, phoneNumber }
 * @returns {Promise<void>}
 */
export const saveUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      name: userData.name,
      phoneNumber: userData.phoneNumber || "",
      email: userData.email || "",
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error(`Error saving profile for user ${uid}:`, error);
    throw error;
  }
};

/**
 * Fetches a user profile from Firestore by UID
 * @param {string} uid - Firebase Auth User UID
 * @returns {Promise<Object|null>} User profile details or null
 */
export const fetchUserProfile = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error(`Error fetching profile for user ${uid}:`, error);
    throw error;
  }
};

/**
 * Updates an existing event details and capacity in a transaction (Admin)
 * @param {string} id - Event ID
 * @param {Object} eventData - Updated event details
 * @returns {Promise<void>}
 */
export const updateEvent = async (id, eventData) => {
  try {
    const eventRef = doc(db, "events", id);
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error("Event does not exist.");
      }
      
      const currentData = eventDoc.data();
      const currentMax = Number(currentData.maxSeats || 0);
      const currentRemaining = Number(currentData.remainingSeats || 0);
      const booked = currentMax - currentRemaining;

      const newMax = Number(eventData.maxSeats);
      if (newMax < booked) {
        throw new Error(`Capacity cannot be reduced below the number of currently booked seats (${booked}).`);
      }

      const newRemaining = newMax - booked;

      transaction.update(eventRef, {
        title: eventData.title,
        type: eventData.type,
        description: eventData.description,
        venue: eventData.venue,
        date: eventData.date,
        time: eventData.time,
        price: Number(eventData.price),
        maxSeats: newMax,
        remainingSeats: newRemaining,
        bannerImage: eventData.bannerImage || currentData.bannerImage || ""
      });
    });
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

/**
 * Deletes an event in Firestore (Admin)
 * @param {string} id - Event ID
 * @returns {Promise<void>}
 */
export const deleteEvent = async (id) => {
  try {
    const eventRef = doc(db, "events", id);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

/**
 * Marks a booking as checked in or resets it (Admin)
 * @param {string} bookingId - Booking ID
 * @param {boolean} checkedIn - true to check in, false to reset
 * @returns {Promise<void>}
 */
export const updateBookingCheckIn = async (bookingId, checkedIn) => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      checkedIn: checkedIn,
      checkedInAt: checkedIn ? new Date().toISOString() : null
    });
  } catch (error) {
    console.error("Error updating check-in status:", error);
    throw error;
  }
};


