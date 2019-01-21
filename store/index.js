export const state = () => ({
  user: null
})

export const mutations = {
  setUser: (state, user) => state.user = user
}

export const getters = {
  user(state) {
    return state.user
  }
}
