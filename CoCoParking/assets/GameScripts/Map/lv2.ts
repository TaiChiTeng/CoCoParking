// 第2关地图数据和汽车数据
import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('Level2Map')
export class Level2Map {
    public static MapW: number = 5;
    public static MapH: number = 6;
    public static Map: number[][] = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, -1, -1, -1]
    ];

    // 汽车数据
    public static CarData: {outerMap: string, sort: number, type: number, inPark: number}[] = [
        {outerMap: 'U0', sort: 0, type: 3, inPark: 0}, // 在停车场外
        {outerMap: 'U1', sort: 0, type: 2, inPark: 0}, // 在停车场外
        {outerMap: 'U1', sort: 1, type: 1, inPark: 0}, // 在停车场外
        {outerMap: 'R0', sort: 0, type: 2, inPark: 0}, // 在停车场外
        {outerMap: 'R0', sort: 1, type: 1, inPark: 0}, // 在停车场外
        {outerMap: 'R1', sort: 0, type: 3, inPark: 0}, // 在停车场外
        {outerMap: 'R2', sort: 0, type: 3, inPark: 0}  // 在停车场外
    ];
}