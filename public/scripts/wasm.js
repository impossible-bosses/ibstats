function fetchAndInstantiate(url, importObject) {
    return fetch(url).then(function (response) {
        return response.arrayBuffer();
    }).then(function(bytes) {
        return WebAssembly.instantiate(bytes, importObject)
    }).then(function(results) {
        return results.instance
    });
}

const importObject = {
    document: {
    },
    element: {
    },
    window: {
    }
};

fetchAndInstantiate("wasm/ibstats.wasm", importObject).then(function(instance) {
    console.log(instance.exports);
    console.log("hello(1, 2)");
    console.log(instance.exports.hello(1, 2));
    console.log("goodbye(1, 2)");
    console.log(instance.exports.goodbye(1, 2));
});
