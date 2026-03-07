import {NodeJSPolylineDecoder} from "./NodeJSPolylineDecoder.js";

const decode = (str, factor) => {return new NodeJSPolylineDecoder().decode(str, factor)};

const CASES = {
    DEFAULT: [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]],
    DEFAULT_ROUNDED: [[39, -120], [41, -121], [43, -126]],
};

describe("decode", () => {
    test("decodes to an empty array", () => {
        expect(decode("")).toEqual([]);
    });

    test("decodes a string into an array of lat lng pairs", () => {
        expect(decode("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual(CASES.DEFAULT);
    });

    test("decodes with a custom precision", () => {
        expect(decode("_izlhA~rlgdF_{geC~ywl@_kwzCn`{nI", 1e6)).toEqual(
            CASES.DEFAULT
        );
    });

    test("decodes with precision 0", () => {
        expect(decode("mAnFC@CH", 1)).toEqual(CASES.DEFAULT_ROUNDED);
    });
});
