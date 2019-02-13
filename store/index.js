import axios from 'axios'


export const state = () => ({
  user: null
})

export const mutations = {
  setUser: (state, user) => state.user = user
}


export const actions = {
  loadUserBalances({ rootState, state, commit }) {
    if (state.user) {
      // TODO Вынести этот эндпоинт в конфиг
      axios.get(`https://lightapi.eosgeneva.io/api/account/jungle/${rootState.user.name}`).then(r => {
        commit('setUser', { ...state.user, balances: r.data.balances }, { root: true })
      })
    }
  }
}


export const getters = {
  user(state) {
    return state.user
  }
}
