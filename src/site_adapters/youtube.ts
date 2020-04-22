'use strict';

import { extractNumber, urlExact, urlContains } from "../utils"
import { createDomScrapingAdapter } from "./domScrapingBase"

const YoutubeAdapter = createDomScrapingAdapter({
    name: "YouTube",
    enabled: () => {
        return urlContains("youtube.com")
    },
    attributes: [
        { name: "id", type: "text", hidden: true },
        { name: "Title", type: "text" },
        { name: "Time", type: "text"},
        { name: "Uploader", type: "text"},
        { name: "% Watched", type: "numeric"}
    ],
    scrapePage: () => {
        let tableRows = document.querySelector('#contents').children;
        return Array.from(tableRows).map((el, index) => {
            let elAsHTMLElement : HTMLElement = <HTMLElement>el;

            if(el.querySelector('#video-title-link') !== null && el.querySelector('#overlays') != null && el.querySelector('#overlays').children[0] != null){

                let overlayChildrenAmount = el.querySelector('#overlays').children.length;
                let timeStampExists = el.querySelector('#overlays').children[overlayChildrenAmount - 2].children[1] !== undefined;
                let timeStamp = timeStampExists
                    ? el.querySelector('#overlays').children[overlayChildrenAmount - 2].children[1].textContent.replace((/  |\r\n|\n|\r/gm),"")
                    : "N/A";
                let watchedPercentage = el.querySelector('#progress') !== null
                    ? progressToNumber((el.querySelector('#progress') as HTMLElement).style.width)
                    : 0;

                return {
                    rowElements: [elAsHTMLElement],
                    id: el.querySelector('#video-title-link').getAttribute("href"),
                    dataValues: {
                        Title: el.querySelector('#video-title'),
                        Time: timeStamp,
                        Uploader: el.querySelector('#text').children[0],
                        '% Watched': watchedPercentage,
                    },
                }
            }
            else
            {
                return null;
            }

        }).filter(el => el !== null)
    },
    // Reload data anytime there's a click or keypress on the page
    addScrapeTriggers: (reload) => {
        document.addEventListener("click", (e) => { reload() });
        document.addEventListener("keydown", (e) => { reload() });
    }
});

function progressToNumber(progress){
    let strippedProgress = progress.slice(0, -1);
    return parseInt(strippedProgress);
}

export default YoutubeAdapter;
