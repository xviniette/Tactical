import assets from "../config/assets.json"

export default {
    data() {
        return {
            baseUrl: process.env.BASE_URL,
        }
    },
    methods: {
        getAssetData(assetName, type = "image") {
            if (assets[type] && assets[type][assetName]) {
                return assets[type] && assets[type][assetName];
            }

            return null;
        }
    }
}