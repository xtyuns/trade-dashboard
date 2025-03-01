import { okxAccessKey, okxPassphrase, okxSecretKey } from "@/app/config";
import { createHmac } from "crypto";

export function getCurrentTimesStr() {
    return new Date().toISOString();
}

export function signRequestHeaders(
    method: string,
    requestPath: string,
    bodyStr: string,
) {
    const timesStr = getCurrentTimesStr();
    return signHeaders(method, requestPath, bodyStr, okxAccessKey, okxSecretKey, okxPassphrase, timesStr);
}

export function signHeaders(
    method: string,
    requestPath: string,
    bodyStr: string,
    apiKey: string,
    secretKey: string,
    passphrase: string,
    timesStr: string,
) {
    const sign = createHmac('sha256', secretKey).update(timesStr + method + requestPath + bodyStr).digest('base64');
    return {
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': sign,
        'OK-ACCESS-TIMESTAMP': timesStr,
        'OK-ACCESS-PASSPHRASE': passphrase,
    };
}

export function getHoldingTimeDescription(holdingTime: number): string {
    const days = Math.floor(holdingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((holdingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((holdingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((holdingTime % (1000 * 60)) / 1000);

    const timeUnits = [
        { unit: '天', value: days, factor: 24 * 60 * 60 },
        { unit: '小时', value: hours, factor: 60 * 60 },
        { unit: '分钟', value: minutes, factor: 60 },
        { unit: '秒', value: seconds, factor: 1 },
    ];

    for (const { unit, value, factor } of timeUnits) {
        if (value > 0) {
            return `${(value + (holdingTime % factor) / factor).toFixed(2)} ${unit}`;
        }
    }

    return '0 秒';
}