// 第5关地图数据和汽车数据
import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('Level7Map')
export class Level7Map {
    public static MapW: number = 5;
    public static MapH: number = 6;
    public static Map: number[][] = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ];

    // 汽车数据
    public static CarData: {outerMap: string, sort: number, type: number, inPark: number}[] = [
        {outerMap: 'U0', sort: 0, type: 3, inPark: 0},
        {outerMap: 'U1', sort: 0, type: 1, inPark: 0},
        {outerMap: 'U1', sort: 1, type: 2, inPark: 0},
        {outerMap: 'U2', sort: 0, type: 3, inPark: 0},
        {outerMap: 'U3', sort: 0, type: 1, inPark: 0},
        {outerMap: 'U3', sort: 1, type: 2, inPark: 0},
        {outerMap: 'U4', sort: 0, type: 3, inPark: 0},
        {outerMap: 'L0', sort: 0, type: 1, inPark: 0},
        {outerMap: 'L0', sort: 1, type: 1, inPark: 0},
        {outerMap: 'L0', sort: 2, type: 1, inPark: 0},
        {outerMap: 'R1', sort: 1, type: 1, inPark: 0},
        {outerMap: 'R2', sort: 2, type: 1, inPark: 0}
    ];
}