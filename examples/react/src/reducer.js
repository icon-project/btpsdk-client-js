
export default function reducer (state, action) {
  switch (action.type) {
    case 'init': {
      return {
        ...state,
        from: action.from,
        to: action.to,
      }
    }
    case 'change_network': {
      return {
        ...state,
        from: { ...state.to },
        to: { ...state.from },
        logs: [],
      }
    }
    case 'add_log': {
      return {
        ...state,
        logs: [ ...state.logs, action.log ]

      }
    }
    case 'clear_logs': {
      return {
        ...state,
        logs: []
      }
    }
    default:
      throw new Error('unsupported action type:', action.type);
  }
}
