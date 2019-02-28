const configs = {
    "development": {
        "api": {
            "baseUrl": "localhost",
            "PORT": 3000,
        },
        "tokenKey": "TacticalToken",
        "settingsKey": "TacticalSettings",
        "networks": {
            "google": "377128481025-drsh57c6rbensqnrf6rv35gue5csqher.apps.googleusercontent.com",
        }
    }
}

export default (() => {
    if (process.env.NODE_ENV && configs[process.env.NODE_ENV]) {
        return configs[process.env.NODE_ENV];
    }
    return configs["development"];
})();