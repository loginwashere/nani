import { HIDE_ABOUT, SET_LANGUAGE, TOGGLE_AUTOPLAY, TOGGLE_ORDER_CONTROLS, SET_THEME, TOGGLE_AUTO_THEME } from '../actions'

export default function Options (state = {
  language: 'enUS',
  autoplay: false,
  aboutVisible: true,
  orderControls: true,
  theme: 'dark',
  autoThemeChange: true,
}, action) {
  switch (action.type) {
    case SET_LANGUAGE:
      return {
        ...state,
        language: action.payload
      }
    case TOGGLE_AUTOPLAY:
      return {
        ...state,
        autoplay: !state.autoplay
      }
    case HIDE_ABOUT:
      return {
        ...state,
        aboutVisible: false
      }
    case TOGGLE_ORDER_CONTROLS:
      return {
        ...state,
        orderControls: !state.orderControls
      }
    case SET_THEME:
      return {
        ...state,
        theme: action.payload
      }
    case TOGGLE_AUTO_THEME:
      return {
        ...state,
        autoThemeChange: !state.autoThemeChange
      }
    default:
      return state
  }
}
