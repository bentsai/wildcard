(function () {
  'use strict';

  // These might change...
  const rowContainerClass = "_fhph4u"
  const rowClass = "_8ssblpx"
  const imageClass = "_1i2fr3fi"
  const titleClass = "_1ebt2xej"
  const priceClass = "_1p7iugi"
  const ratingClass = "_ky9opu0"
  const listingLinkClass = "_i24ijs"
  const likeListClass = "_v44ajx"
  const closeModalClass = "_1rp5252"

  function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  }

  function openTab(url) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  
  function likeRow(row, rest) {
    console.log("liking row ", row)
    let likeButton = row.div.querySelectorAll("button")[2] // so brittle...
    console.log("like button: ", likeButton)
    likeButton.click()
    setTimeout(() => {
      let list = document.querySelector("." + likeListClass)
      list.click()

      setTimeout(() => {
        let closeButton = document.querySelector("." + closeModalClass)
        closeButton.click()

        if (rest.length !== 0) {
          setTimeout(() => {
            likeRow(rest[0], rest.slice(1))
          }, 1000)
        }
      }, 1000)
    }, 1000)

  }

  const setupTable = () => {
    let rowContainer = document.querySelector("." + rowContainerClass)

    let rows = [...rowContainer.children].map(row => {
      return {
        div: row,
        id: row.querySelectorAll("meta[itemprop=position]")[0].getAttribute("content"),
        imgUrl: row.querySelector("." + imageClass).getAttribute("style").match(/url\(\"(.*)\"\)/)[1],
        title: row.querySelector("." + titleClass) && row.querySelector("." + titleClass).textContent,
        price: row.querySelector("." + priceClass) && row.querySelector("." + priceClass).textContent.match(/\$([\d]*)/)[1],
        rating: row.querySelector("." + ratingClass) && row.querySelector("._ky9opu0").textContent,
        href: row.querySelector("." + listingLinkClass) && row.querySelector("." + listingLinkClass).getAttribute('href')
        // todo: add scraped data here
      }
    })

    window.guinea = rows[0]
    console.log("rows", rows)

    // takes string IDs and shows only those rows
    let showRows = function (ids) {
      rowContainer.innerHTML = ""
      ids.forEach (id => {
        let row = rows.find(r => r.id === id)
        rowContainer.appendChild(row.div)
      })
    }

    let newDiv = htmlToElement("<div id=\"open-apps\" class=\"mydiv\" style=\"border-top: solid thin #ddd; position: fixed; overflow: hidden; background-color: white; height: 250px; width: 100%; z-index: 1000; bottom: 0;\"><div id=\"open-apps-table\"></div></div>")
    document.body.appendChild(newDiv);

    var link = window.document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css';
    document.getElementsByTagName("head")[0].appendChild(link);

    var data = rows.map(r => {
      return {
        id: r.id,
        img: '<img style="max-height: 50px;" src="' + r.imgUrl + '"/>', 
        name: r.title,
        price: r.price,
        rating: r.rating
      }
    })

    var container = document.getElementById('open-apps-table');

    var hot = new Handsontable(container, {
      data: data,
      rowHeaders: true,
      colHeaders: ['', 'Image', 'Name', 'Price', 'Rating', 'Custom'],
      filters: true,
      stretchH: 'all',
      hiddenColumns: {
        copyPasteEnabled: true,
        indicators: true,
        columns: [0]
      },
      contextMenu: {
        items: {
          "row_above": {}, "row_below": {}, "col_left": {}, "col_right": {}, "---------": {},
          "favorite": { // Own custom option
            name: "Favorite",
            hidden: false,
            callback: function (key, selection, clickEvent) { // Callback for specific option
              let ids = hot.getData(selection[0].start.row, 0, selection[0].end.row, 0).map(r => r[0]);
              let rowsToLike = ids.map(id => { return rows.find(r => r.id === id) })
              console.log("favorited", "ids", ids, "rows", rows, "rowstolike", rowsToLike);

              likeRow(rowsToLike[0], rowsToLike.slice(1))

            }
          },
          "openlink": { // Own custom option
            name: "Open link",
            hidden: false,
            callback: function (key, selection, clickEvent) { // Callback for specific option
              let ids = hot.getData(selection[0].start.row, 0, selection[0].end.row, 0).map(r => r[0]);
              let rowsToLike = ids.map(id => { rows.find(r => r.id === id) })

              rowsToOpen.forEach(row => {
                console.log("opening ", row.href)
                openTab(row.href)
              })
            }
          },
        }
      },
      dropdownMenu: true,
      columnSorting: true,
      columns: [
        { data: "id" },
        { data: "img", renderer: "html" },
        { data: "name" },
        { data: "price" },
        { data: "rating" },
        { data: "other" }
      ]
    });

    // register hooks to re-sort the list
    ['afterColumnSort', 'afterFilter'].forEach(hook => {
      Handsontable.hooks.add(hook, (c, d) => { 
        let ids = hot.getDataAtCol(0)
        showRows(ids)
      }, hot)
    })
  };


  if (document.readyState === "complete") {
    setupTable();
  } else {
    window.addEventListener("load", setupTable);
  }
})();