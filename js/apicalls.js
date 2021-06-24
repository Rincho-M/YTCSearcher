export { SendJson };

let _apiUrl = "http://185.201.88.186:7911/api/statistic/addrequest";

// Used to send some data about request to the server.
function SendJson(requestData) {
    fetch(_apiUrl, {
        method: "POST",
        headers: { 
            "Content-type": "application/json"
        },
        body: JSON.stringify(requestData)
    });
}