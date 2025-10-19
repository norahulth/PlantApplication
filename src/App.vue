<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <a class="navbar-brand" href="#">BOOKING</a>
    <button
      class="navbar-toggler mx-2 mb-2"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNav"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div id="navbarNav" class="collapse navbar-collapse mx-2">
      <ul class="navbar-nav">
        <li class="nav-item dropdown">
          <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown"
            >ADMIN</a
          >
          <div class="dropdown-menu">
            <a href="#" class="dropdown-item" @click="redirect('/admin')"
              >PROFILE</a
            >
            <a
              href="#"
              class="dropdown-item"
              :disabled="!$store.getters.isAuthenticated"
              @click="logout()"
              >SIGN OUT</a
            >
          </div>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" @click="redirect('/showtimeslots')"
            >TIME SLOTS</a
          >
        </li>
      </ul>
    </div>
  </nav>
  <section class="container-fluid py-4">
    <router-view />
  </section>
</template>

<script>
// @ is an alias to /src
import "bootstrap";

export default {
  name: "App",
  components: {},
  data: () => ({}),
  mounted() {},
  methods: {
    redirect(target) {
      const { commit } = this.$store;
      commit("setAuthMessage", {
        message: null,
        variant: "alert alert-success",
      });
      commit("setBookingMessage", { message: null, variant: "alert-danger" });
      this.$router.push(target).catch((e) => console.log(e.message));
    },
    logout() {
      const { commit, getters } = this.$store;
      if (getters.isAuthenticated) {
        commit("setAuthenticated", { user: null, authenticated: false });
        commit("setAuthMessage", {
          message: "Signed out successfully",
          variant: "alert alert-success",
        });
        this.$router.push("/login");
      }
    },
  },
};
</script>

<style>
@import url("bootstrap/dist/css/bootstrap.css");

html,
body {
  background-color: #edb9ca;
  font-family: Garamond, serif;
}

.navbar-brand {
  padding-left: 20px;
}

.nav-link {
  padding-left: 20px;
}
</style>
