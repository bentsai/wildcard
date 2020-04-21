
// todo: define types for these events
// https://redux.js.org/recipes/usage-with-typescript

// Many of these actions don't directly affect the Redux state,
// instead they ask a TableAdapter to do something async,
// which will update the redux state on completion.
// We use async redux-thunk action creators for this.

import { Table, TableAdapter, tableId, recordId, RecordEdit } from './types'
import includes from 'lodash/includes'
import keys from 'lodash/keys'
import groupBy from 'lodash/groupBy'
import forIn from 'lodash/forIn'
import pick from 'lodash/pick'

export const initializeActions = (TableAdapters:{ [key: string]: TableAdapter }) => {
  const tableReloaded = (table:Table) =>
    ({ type: "TABLE_RELOADED", table })

  return {
    tableReloaded: tableReloaded,

    addAttribute (tableId:tableId) {
      return (dispatch) => {
        dispatch({
          type: "ADD_ATTRIBUTE_REQUESTED"
        })
        const TableAdapter = TableAdapters[tableId];
        TableAdapter.addAttribute().then(
          // no need to do anything, since we're already subscribed to reloads
          (_table) => { },
          (err) => { console.error(err) }
        )
      }
    },

    editRecords(edits) {
      return (dispatch) => {
        dispatch({ type: "EDIT_RECORDS_REQUESTED", edits })

        // split up the request edits by table, and ask each table to
        // do its part of the edits

        const editsByTable = groupBy(edits, e => e.tableId);

        forIn(editsByTable, (edits, tableId) => {
          const TableAdapter = TableAdapters[tableId];
          const editsForTable:Array<RecordEdit> = edits.map(e => pick(e, "recordId", "attribute", "value"))
          console.log("edit command to", tableId, editsForTable)
          TableAdapter.editRecords(editsForTable);
        });
      }
    },

    sortRecords (sortConfig) {
      return { type: "SORT_RECORDS", sortConfig }
    }
  }
}
