const fs = require("fs");

var Excel = require('exceljs');

var Bottleneck = require("bottleneck/es5");

var _cliProgress = require('cli-progress');

var workbook = new Excel.Workbook();


// set up excel workbook

var sheet = workbook.addWorksheet('All Data');
var keyword_sheet = workbook.addWorksheet('Keyword');
var entities_sheet = workbook.addWorksheet('Entities');
var categories_sheet = workbook.addWorksheet('Categories');

const worksheet_alldata_header = ['Type', 'URL', 'Data', 'Relevancy Score', 'Frequency']
const worksheet_summary_header = ['Type', 'Data', 'Relevancy Score', 'Frequency']

sheet.addRow(worksheet_alldata_header);
keyword_sheet.addRow(worksheet_summary_header);
entities_sheet.addRow(worksheet_summary_header);
categories_sheet.addRow(worksheet_summary_header);



// SETTING UP ACCESS TO IBM WATSON NLU

// Create IBM Cloud account https://cloud.ibm.com
// Create an instance of the service https://cloud.ibm.com/catalog/services/natural-language-understanding - 'create'
// Go to resource list - https://cloud.ibm.com/resources
// Find natural language understanding service in list
// Copy the API Key and URL values and paste below

var NaturalLanguageUnderstandingV1 = require("watson-developer-cloud/natural-language-understanding/v1.js");

const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
    version: "2018-11-16",
    iam_apikey: "",
    url: ""
});

console.log("Tool Started")

//read URLs from txt file into array

const items = fs
    .readFileSync("add-urls-here.txt")
    .toString()
    .split("\n");


const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);

bar1.start(items.length, 0);

// main function to call IBM Watson API

const check_URLs = (url, index) => {

    bar1.update(index + 1);

    return new Promise(resolve => {
        const parameters = {
            url: url,
            features: {
                keywords: {
                    limit: 15
                },
                entities: {
                    limit: 15
                },
                categories: {
                    limit: 15
                }
            }
        };

        naturalLanguageUnderstanding.analyze(parameters, (err, response) => {
            if (err) {
                resolve(err);
            } else {
                const csv_output = [];

                if ("keywords" in response && Object.entries(response.keywords) !== null && Object.entries(response.keywords).length !== 0) {
                    let data_keywords = response.keywords;
                    data_keywords.forEach(function(keyword) {
                        let keyword_row = [];

                        keyword_row.push("keywords");
                        keyword_row.push(response.retrieved_url);
                        keyword_row.push(keyword.text);
                        keyword_row.push(keyword.relevance);
                        if (keyword.count == null) { keyword_row.push(1) } else { keyword_row.push(keyword.count) };

                        if (keyword_row !== undefined || keyword_row.length !== 0) {
                            csv_output.push(keyword_row);
                        };
                    });
                };


                if ("entities" in response && Object.entries(response.entities) !== null && Object.entries(response.entities).length !== 0) {
                    let data_entities = response.entities;
                    data_entities.forEach(function(entity) {
                        let entity_row = [];

                        entity_row.push("entity");
                        entity_row.push(response.retrieved_url);
                        entity_row.push(entity.text);
                        entity_row.push(entity.relevance);
                        if (entity.count == null) { entity_row.push(1) } else { entity_row.push(entity.count) };

                        if (entity_row !== undefined || entity_row.length !== 0) {
                            csv_output.push(entity_row);
                        };
                    });
                };

                if ("categories" in response && Object.entries(response.categories) !== null && Object.entries(response.categories).length !== 0) {
                    let data_categories = response.categories;
                    data_categories.forEach(function(category) {
                        let category_row = [];

                        category_row.push("category");
                        category_row.push(response.retrieved_url);
                        category_row.push(category.label);
                        category_row.push(category.score);
                        category_row.push(1);

                        if (category_row !== undefined || category_row.length !== 0) {
                            csv_output.push(category_row);
                        };
                    });
                };

                resolve(csv_output);
            }
        })
    });
};

// limiting requests to IBM Watson NLU API to avoid 429 'too many requests' errors

const limiter = new Bottleneck({
    // amount of requests allowed to be open
    // maxConcurrent: 1,
    // time between requests
    minTime: 100
});

const wrapped = limiter.wrap(check_URLs)

var actions = items.map((url, index) => wrapped(url, index));

var results = Promise.all(actions)

results.then(data => {

    const flat_data = [].concat.apply([], data);

    const clean_data = flat_data.filter((i) => {
        if (Array.isArray(i)) {
            return i
        }
    });

    sheet.addRows(clean_data);

    pivotArray(clean_data)

    workbook.xlsx.writeFile("nlu-summary.xlsx")

    bar1.stop();
    console.log("Tool Complete!")

});


// sum relevancy and frequency for matching data tapics

const pivotArray = (data) => {

    var summedArray = [];

    var pivot_data = [...data]
    pivot_data.splice(1, 1) // remove first row from the array as it's corrupt

    for (var i = 0; i < pivot_data.length - 1; i++) {
        var temp_relevancy = 0;
        var temp_frequency = 0;
        for (var k = i; k < pivot_data.length; k++) {
            if (pivot_data[i][0] === pivot_data[k][0] && pivot_data[i][2] === pivot_data[k][2]) {
                temp_relevancy += pivot_data[k][3];
                temp_frequency += pivot_data[k][4];
                pivot_data[k][3] = 0
                pivot_data[k][4] = 0
            }
        }
        if (temp_relevancy != 0) {

            data_line = []

            data_line.push(pivot_data[i][0])
            data_line.push(pivot_data[i][2])
            data_line.push(temp_relevancy)
            data_line.push(temp_frequency)

            summedArray.push(data_line)
        }

    }

    // sort array by relevancy score

    const sortArray = (array) => {
        array.sort((a, b) => {
            return b[2] - a[2];
        });
    }

    // filter array by data type e.g. keyword, entity etc.

    const filterArray = (data_type) => {
        return summedArray.filter(function(i) {
            if (i.indexOf(data_type) !== -1) {
                return i
            }
        });

    }

    const keyword_sum_array = filterArray('keywords')

    const entity_sum_array = filterArray('entity')

    const category_sum_array = filterArray('category')

    sortArray(keyword_sum_array)
    sortArray(entity_sum_array)
    sortArray(category_sum_array)

    // only keep the first 25 array elements

    const sizeArray = 50

    const keywords = keyword_sum_array.slice(0, sizeArray);
    const entities = entity_sum_array.slice(0, sizeArray);
    const categories = category_sum_array.slice(0, sizeArray);

    // fs.writeFile("./pre-sortfilter-log.txt", JSON.stringify(data), function(err) {
    //     if (err) {
    //         console.error('log file error');
    //     }
    // })

    // fs.writeFile("./keywords-log.txt", JSON.stringify(keywords), function(err) {
    //     if (err) {
    //         console.error('log file error');
    //     }
    // })
    // fs.writeFile("./entities-log.txt", JSON.stringify(entities), function(err) {
    //     if (err) {
    //         console.error('log file error');
    //     }
    // })
    // fs.writeFile("./categories-log.txt", JSON.stringify(categories), function(err) {
    //     if (err) {
    //         console.error('log file error');
    //     }
    // })

    keyword_sheet.addRows(keywords)
    entities_sheet.addRows(entities)
    categories_sheet.addRows(categories)

}
