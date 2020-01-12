'use strict';

import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";

import "./wildcard.css";

import _ from "lodash";

// convert HTML to a dom element
function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

function createToggleButton(container) {
  // set up button to open the table
  let toggleBtn = htmlToElement(`<button style="
    font-weight: bold;
    border-radius: 10px;
    z-index: 100000;
    padding: 10px;
    position: fixed;
    top: 20px;
    left: 50%;
    background-color: white;
    box-shadow: 0px 0px 10px -1px #d5d5d5;
    border: none;
    " class="open-apps-trigger">💡Table View</button>'`)
  toggleBtn.addEventListener('click', () => { container.style.visibility = (container.style.visibility === "visible") ? "hidden" : "visible" })
  document.body.appendChild(toggleBtn)
}

// Given an Element for a cell, get the value to display in the table.
// Currently default behavior is crude: just gets the input value or text content.
let getValueFromElement = (spec, cellElement) => {
  if (spec.hasOwnProperty("getValue")) {
    return spec.getValue(cellElement)
  } else {
    return cellElement.value || cellElement.textContent
  }
}

function getDataFromPage(options : TableOptions) {
  let rows = options.getDataRows();
  return rows.map(rowEl => {
    let row = { el: rowEl }
    options.colSpecs.forEach(spec => {
      let cellValue;
      // handle a hardcoded value for all rows in the column
      if(spec.hasOwnProperty("colValue")) { cellValue = spec.colValue }
      else {
        let cellEl = spec.el(rowEl)
        cellValue = getValueFromElement(spec, cellEl)
      }
      row[spec.fieldName] = cellValue
    })
    return row
  })
}

function colSpecFromProp(prop, options) {
  return options.colSpecs.find(spec => spec.fieldName == prop)
}

interface ColSpecs {
  /** The name of this data column, to be displayed in the table */
  fieldName: string;
  el(row: HTMLElement): HTMLElement;
  getValue?(el: HTMLElement) : any;
  colValue? : any; // hardcode the value for all rows
  readOnly?: boolean;
  type: string;
  editor?: string,
  renderer?: string,
  hidden?: boolean
}

interface TableOptions {
  colSpecs: Array<ColSpecs>;
  getDataRows(): Array<HTMLElement>;
  setupReloadTriggers(setupFn: any): any;
  getRowContainer(): HTMLElement;
}

/** The main method for creating a Wildcard site adapter. 
 *  In your adapter, call this with a valid [[TableOptions]] object
 *  to initialize your adapter.
 */
const createTable = (options: TableOptions) => {
  // set up data for table
  let rowContainer = options.getRowContainer()
  let rows = options.getDataRows()
  let data = getDataFromPage(options)
  let rowsById = _.chain(data).keyBy(row => row.id).mapValues(row => row.el).value()

  console.log("data", data, "rows by id", rowsById)

  let columns = options.colSpecs.map(col => ({
    data: col.fieldName,
    readOnly: col.readOnly,
    type: col.type,
    dateFormat: "MM/DD/YYYY",
    datePickerConfig: {
      events: ['Sun Dec 15 2019', 'Sat Dec 07 2019'], //todo: move this out of the core plugin
      firstDay: 1,
      numberOfMonths: 3
    },
    editor: col.editor,
    renderer: col.renderer,
    hidden: col.hidden
  }))

  let hiddenColIndexes = columns.map((col, idx) => col.hidden ? idx : null).filter(e => Number.isInteger(e))

  // create container div
  let newDiv = htmlToElement("<div id=\"wildcard-container\" style=\"\"><div id=\"wildcard-table\"></div></div>") as HTMLElement
  if (rows.length == 1) { newDiv.classList.add("single-row") }
  document.body.appendChild(newDiv);
  var container = document.getElementById('wildcard-table');

  var hot = new Handsontable(container, {
    data: data,
    rowHeaders: true,
    colHeaders: options.colSpecs.map(col => col.fieldName),
    filters: true,
    formulas: true,
    stretchH: 'none',
    dropdownMenu: true,
    columnSorting: true,
    columns: columns,
    hiddenColumns: {
      columns: hiddenColIndexes,
    },
    afterChange: (changes) => {
      if (changes) {
        changes.forEach(([row, prop, oldValue, newValue]) => {
          let colSpec = colSpecFromProp(prop, options)
          if (colSpec.readOnly) { return; }

          let rowEl = rows[row] // this won't work with re-sorting; change to ID
          let el = colSpec.el(rowEl)
          el.value = newValue
        });
      }
    },
    licenseKey: 'non-commercial-and-evaluation'
  });

  createToggleButton(newDiv);

  let reloadData = () => {
    let data = getDataFromPage(options)
    hot.loadData(data)
  }

  // set up handlers to react to div changes
  // todo: this is inefficient; can we make fewer handlers?
  rows.forEach((row, idx) => {
    options.colSpecs.forEach(col => {
      let el = col.el(row)
      el.addEventListener("input", e => reloadData)
    })
  })

  // set up page-specific reload triggers
  options.setupReloadTriggers(reloadData)

  // Highlight the selected row or cell in the original page.
  // This is important for establishing a clear mapping between page and table.
  // Probably need to provide a lot more site-specific config, including:
  // * whether to highlight just cells or whole row
  // * colors
  // * borders vs background
  Handsontable.hooks.add('afterSelectionByProp', (row, prop) => {
    const highlightColor = "#c9ebff"
    const unhighlightColor = "#ffffff"

    let rowEl : HTMLElement = rowsById[hot.getDataAtCell(row, 0)]
    let colSpec = colSpecFromProp(prop, options)
    let colEl : HTMLElement = colSpec.el(rowEl)

    if (rows.length > 1) {
      console.log("more than one row", rows, "highlighting", rowEl)
      // For multiple rows, we highlight the whole row

      rowEl.style["background-color"] = highlightColor
      rowEl.scrollIntoView({ behavior: "smooth", block: "center" })

      // Clear highlight on other divs
      let otherDivs = rows.filter(r => r !== rowEl)
      console.log("clearing", otherDivs)
      otherDivs.forEach( d => d.style["background-color"] = unhighlightColor )
    } else {
      console.log("only one row", rows.length)
      // For a single row, we highlight individual cells in the row

      // Add a border and scroll selected div into view
      colEl.style["background-color"] = highlightColor
      colEl.scrollIntoView({ behavior: "smooth", block: "center" })

      // Clear border on other divs
      let otherDivs = options.colSpecs.filter(spec => spec !== colSpecFromProp(prop, options)).map(spec => spec.el(rowEl))
      otherDivs.forEach( d => d.style["background-color"] = unhighlightColor )
    }
  }, hot)

  let hooks = ["afterColumnSort" as const, "afterFilter" as const]
  hooks.forEach(hook => {
    Handsontable.hooks.add(hook, () => {
      let ids = hot.getDataAtCol(0)
      rowContainer.innerHTML = ""
      ids.forEach (id => { rowContainer.appendChild(rowsById[id]) })
    })
  })
}

export { createTable }