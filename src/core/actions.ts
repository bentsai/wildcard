
// todo: define types for these events
// https://redux.js.org/recipes/usage-with-typescript

// Many of these actions don't directly affect the Redux state,
// instead they ask a TableStore to do something async,
// which will update the redux state on completion.
// We use async redux-thunk action creators for this.

import { Table, TableStore, tableId, recordId } from './types'
import includes from 'lodash/includes'
import keys from 'lodash/keys'

export const initializeActions = (tableStores:{ [key: string]: TableStore }) => {
  const tableReloaded = (table:Table) =>
    ({ type: "TABLE_RELOADED", table })

  return {
    tableReloaded: tableReloaded,

    addAttribute (tableId:tableId) {
      return (dispatch) => {
        dispatch({
          type: "ADD_ATTRIBUTE_REQUESTED"
        })
        const tableStore = tableStores[tableId];
        // this causes a double reload because we're also
        // subscribed to the table separately...
        // doesn't seem like a huge problem
        tableStore.addAttribute().then(
          (table) => dispatch(tableReloaded(table)),
          (err) => { console.error(err) }
        )
      }
    },

    editRecord (tableId, recordId, attribute, value) {
      return (dispatch) => {
        dispatch({
          type: "EDIT_RECORD_REQUESTED",
          tableId,
          recordId,
          attribute,
          value
        })

        const tableStore = tableStores[tableId];
        // this causes a double reload because we're also
        // subscribed to the table separately...
        // doesn't seem like a huge problem
        tableStore.editRecord(recordId, attribute, value).then(
          (table) => dispatch(tableReloaded(table)),
          (err) => { console.error(err) }
        )
      }
    },

    sortRecords (sortConfig) {
      return { type: "SORT_RECORDS", sortConfig }
    }
  }
}
