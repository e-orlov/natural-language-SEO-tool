# natural-language-SEO-tool
Submit URLs in bulk to the IBM Watson Natural Language API and output keywords, entities and categories

1. Get access to the API (see below)
2. Add API details to index.js
3. Add URLs you want to run through the API in file.txt
4. nlu-output.csv will contain all of your natural language data

**The script does not limit the amount of requests made to the API, avoid checking large amounts of URLs in one go - stick to around 100/150 to reduce error responses**

## Setting up access to IBM Watson Natural Language API

1. Create IBM Cloud account https://cloud.ibm.com
2. Create an instance of the service https://cloud.ibm.com/catalog/services/natural-language-understanding
3. Go to resource list - https://cloud.ibm.com/resources
4. Find natural language understanding service in list
5. Copy the API Key and URL values and paste below

## What to do with the data

Once you have your nlu-output.csv data open it in excel and pivot to look for recurring keywords/entities - see this blog post for further info
