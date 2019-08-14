# natural-language-SEO-tool
Submit URLs in bulk to the IBM Watson Natural Language API and output keywords, entities and categories

1. Get access to the API (see below)
2. Add API details to index.js
3. Add URLs you want to run through the API in add-urls-here.txt
4. nlu-summary.xlsx will contain all of your natural language data

**The script has the ability to limit requests to the IBM Watson API, see 'limiter' variable in index.js.
Use 'minTime', e.g. 1000 = wait one second before next request
**

## Setting up access to IBM Watson Natural Language API

1. Create IBM Cloud account https://cloud.ibm.com
2. Create an instance of the service https://cloud.ibm.com/catalog/services/natural-language-understanding
3. Go to resource list - https://cloud.ibm.com/resources
4. Find natural language understanding service in list
5. Copy the API Key and URL values and paste below
