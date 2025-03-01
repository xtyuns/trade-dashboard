'use server';

import { signRequestHeaders } from "@/utils/okxUtils";
import { okxApiBaseUrl } from "../config";
import { Position } from "@/types/okx";

export async function getAccountHistoryPosition(
    after?: string,
    before?: string,
    limit?: number,
): Promise<Position[]> {
    const method = 'GET';
    const path = '/api/v5/account/positions-history';
    const params = {
        after,
        before,
        limit,
    }
    const values = Object.entries(params).filter(([_, value]) => value);
    const query = values.reduce((acc, cur) => {
        acc.append(cur[0], cur[1]!!.toString());
        return acc;
    }, new URLSearchParams()).toString();
    const requestPath = [path, query].filter(Boolean).join('?');
    const bodyStr = '';
    const headers = signRequestHeaders(method, requestPath, bodyStr);
    const response = await fetch(`${okxApiBaseUrl}${requestPath}`, {
        headers: headers,
    });
    if (!response.ok) {
        console.log(response);
        throw new Error(response.statusText);
    }

    const responseData: {
        code: number;
        data: Position[];
        msg: string;
    } = await response.json();
    return responseData.data;
}