export default class Element {
    constructor(json) {
        this.init(json);
    }

    init(json) {
        var deepMerge = (ob1, ob2) => {
            for (var i in ob2) {
                if (ob1[i] == undefined || typeof ob1[i] !== 'object') {
                    ob1[i] = ob2[i];
                } else {
                    deepMerge(ob1[i], ob2[i]);
                }
            }
        }
        deepMerge(this, json);
    }
}