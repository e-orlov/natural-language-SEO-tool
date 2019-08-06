const fs = require("fs");

var csv = require("fast-csv");

var ws = fs.createWriteStream("nlu-output.csv");


// SETTING UP ACCESS TO IBM WATSON NLU

// Create IBM CLoud account https://cloud.ibm.com
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

const items = fs
    .readFileSync("file.txt")
    .toString()
    .split("\r\n");

var fn = function check_URLs(url) {
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

                if ("keywords" in response &&Object.entries(response.keywords) !== null && Object.entries(response.keywords).length !== 0) {
                    let data_keywords = response.keywords;
                    data_keywords.forEach(function(keyword) {
                        let keyword_row = [];

                        keyword_row.push("keywords");
                        keyword_row.push(response.retrieved_url);
                        keyword_row.push(keyword.text);
                        keyword_row.push(keyword.relevance);
                        keyword_row.push(keyword.count);
                        csv_output.push(keyword_row);
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
                        entity_row.push(entity.count);
                        csv_output.push(entity_row);
                    });
                };

                if ("categories" in response &&Object.entries(response.categories) !== null && Object.entries(response.categories).length !== 0) {
                    let data_categories = response.categories;
                    data_categories.forEach(function(category) {
                        let category_row = [];

                        category_row.push("category");
                        category_row.push(response.retrieved_url);
                        category_row.push(category.label);
                        category_row.push(category.score);
                        csv_output.push(category_row);
                    });
                };

                resolve(csv_output);
            }
        });
    });
};

var actions = items.map(fn); // run the function over all items

// we now have a promises array and we want to wait for it

var results = Promise.all(actions); // pass array of promises

results.then(data => {
    
    const header_row = ['Category','URL','Data','Relevancy Score','Frequency']

    const flat_data = [].concat.apply([], data);

    flat_data.splice(0, 0, header_row)

    console.log(flat_data);

    csv.write(flat_data, { headers: true }).pipe(ws);
});





