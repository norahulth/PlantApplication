import { createStore } from "vuex";

export default createStore({
  state: {
    message: null,
    messageVariant: "alert-danger",
    bookingMessage: null,
    bookingMessageVariant: "alert-danger",
    authenticated: false,
    user: null,
    times: [
      {
        id: 1,
        time: "00:00",
        reserved: false,
        reservedBy: null,
        username: "Lorem",
      },
      {
        id: 2,
        time: "03:00",
        reserved: false,
        reservedBy: null,
        username: "Lorem",
      },
      {
        id: 3,
        time: "06:00",
        reserved: false,
        reservedBy: null,
        username: "Lorem",
      },
      {
        id: 4,
        time: "08:00",
        reserved: false,
        reservedBy: null,
        username: "hej123",
      },
      {
        id: 5,
        time: "10:00",
        reserved: false,
        reservedBy: null,
        username: "hej123",
      },
      {
        id: 6,
        time: "12:00",
        reserved: false,
        reservedBy: null,
        username: "hej123",
      },
    ].sort((a, b) => {
      if (a.time > b.time) return 1;
      if (a.time < b.time) return -1;
      return 0;
    }),
    pending: null,
    confirmedBy: "",
  },
  getters: {
    authMessage(state) {
      return state.message;
    },
    authMessageVariant(state) {
      return state.messageVariant;
    },
    bookingMessage(state) {
      return state.bookingMessage;
    },
    bookingMessageVariant(state) {
      return state.bookingMessageVariant;
    },
    isAuthenticated(state) {
      return state.authenticated;
    },
    username(state) {
      return state.user;
    },
    times(state) {
      return state.times;
    },
    pending(state) {
      return state.pending;
    },
  },
  mutations: {
    setAuthenticated(state, { user, authenticated }) {
      state.authenticated = authenticated;
      state.user = user;
    },
    setAuthMessage(state, { message, variant }) {
      state.message = message;
      state.messageVariant = variant;
    },
    setBookingMessage(state, { message, variant }) {
      state.bookingMessage = message;
      state.bookingMessageVariant = variant;
    },
    addTime(state, time) {
      state.times.push(time);
      state.times.sort((a, b) => {
        if (a.time > b.time) return 1;
        if (a.time < b.time) return -1;
        return 0;
      });
    },
    deleteTime(state, timeId) {
      const index = state.times.findIndex(({ id }) => id === timeId);
      state.times.splice(index, 1);
    },
    setPending(state, time) {
      state.pending = time;
    },
    setReserved(state, time) {
      const index = state.times.findIndex(({ id }) => id === time.id);
      state.times.splice(index, 1, time);
    },
  },
  actions: {},
  modules: {},
});
