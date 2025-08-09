import { _decorator } from 'cc';
// 导入所有关卡的地图数据
import { Level1Map } from './Map/lv1';
import { Level2Map } from './Map/lv2';
import { Level3Map } from './Map/lv3';
import { Level4Map } from './Map/lv4';
import { Level5Map } from './Map/lv5';

const { ccclass } = _decorator;

@ccclass('MapData')
export class MapData {
    // 存储关卡地图数据的映射
    private static levelMapClasses = {
        1: Level1Map,
        2: Level2Map,
        3: Level3Map,
        4: Level4Map,
        5: Level5Map
    };

    // 根据关卡数获取地图数据
    public static getMapDataByLevel(level: number): {MapW: number, MapH: number, Map: number[][]} {
        // 确保关卡数在有效范围内
        if (level < 1 || level > this.getTotalLevels()) {
            console.error(`Invalid level: ${level}, using level 1 instead.`);
            level = 1;
        }

        const LevelMapClass = this.levelMapClasses[level];
        return {
            MapW: LevelMapClass.MapW,
            MapH: LevelMapClass.MapH,
            Map: LevelMapClass.Map
        };
    }

    // 根据关卡数获取汽车数据
    public static getCarDataByLevel(level: number): {outerMap: string, sort: number, type: number, inPark: number}[] {

        // 确保关卡数在有效范围内
        if (level < 1 || level > this.getTotalLevels()) {
            console.error(`Invalid level: ${level}, using level 1 instead.`);
            level = 1;
        }

        const LevelMapClass = this.levelMapClasses[level];
        return LevelMapClass.CarData || [];
    }

    // 获取关卡总数
    public static getTotalLevels(): number {
        return Object.keys(this.levelMapClasses).length;
    }
}