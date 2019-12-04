// Return all the "item" divs in a list
const getDataRows = () => {
  return [
    document.getElementById("gcw-packages-form-hp-package")
  ]
}

// provide column names, column config, and lambda for finding that column's div within a row
const colSpecs = [
  {
    fieldName: "origin",
    el: (row) => row.querySelector("#package-origin-hp-package"),
    readOnly: true,
    type: "text"
  },
  {
    fieldName: "destination",
    el: (row) => row.querySelector("#package-destination-hp-package"),
    readOnly: true,
    type: "text"
  },
  {
    fieldName: "departDate",
    el: (row) => row.querySelector("#package-departing-hp-package"),
    readOnly: false,
    type: "date"
  },
  {
    fieldName: "returnDate",
    el: (row) => row.querySelector("#package-returning-hp-package"),
    readOnly: false,
    type: "date"
  }
];

// set up triggers for when the data should reload
// todo: this is a weird API... simplify?
const setupReloadTriggers = (reload) => {
  document.addEventListener("click", (e) => {
    if (e.target.matches("button.datepicker-cal-date")) {
      reload()
    }
  })
}
