import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween } from 'cc';
import { MapData } from './MapData';
import { UIManager } from './UIManager';
const { ccclass, property } = _decorator;

// 汽车位置策略接口
interface CarPositionStrategy {
    calculatePosition(sortIndex: number, type: number): Vec3;
    updateOffset(type: number): void;
    reset(): void;
}

// 汽车停放信息接口
interface CarParkingInfo {
    outerMap: string;
    sort: number;
    type: number;
    headMap: number;
    tailMap: number;
    node: Node;
    inPark: number; // 0: 在停车场外, 1: 在停车场内
}

// 汽车移动状态枚举
enum CarMovementStatus {
    CAN_MOVE_UP,
    CAN_MOVE_DOWN,
    CANNOT_MOVE,
    CAN_MOVE_DOWN_IN_PARK,
    CAN_MOVE_DOWN_OUT_PARK,
    CAN_MOVE_LEFT,
    CAN_MOVE_LEFT_IN_PARK,
    CAN_MOVE_LEFT_OUT_PARK,
    CAN_MOVE_RIGHT,
    PLAYING_ANIM
}

// 汽车方向枚举
enum CarDirection {
    UP = 'U',
    LEFT = 'L',
    RIGHT = 'R'
}

// 常量定义
const CONSTANTS = {
    CAR_POSITION_OFFSET: 100,
    DEFAULT_ANIM_DURATION: 0.3,
    MAX_CAR_TYPE: 3,
    MIN_CAR_TYPE: 1
} as const;

// 上方向汽车位置策略
class UpperCarPositionStrategy implements CarPositionStrategy {
    private offsetY: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        return new Vec3(0, this.offsetY, 0);
    }

    updateOffset(type: number): void {
        this.offsetY -= CONSTANTS.CAR_POSITION_OFFSET * type;
    }

    reset(): void {
        this.offsetY = 0;
    }
}

// 左方向汽车位置策略
class LeftCarPositionStrategy implements CarPositionStrategy {
    private offsetX: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        return new Vec3(this.offsetX, 0, 0);
    }

    updateOffset(type: number): void {
        this.offsetX += CONSTANTS.CAR_POSITION_OFFSET * type;
    }

    reset(): void {
        this.offsetX = 0;
    }
}

// 右方向汽车位置策略
class RightCarPositionStrategy implements CarPositionStrategy {
    private offsetX: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        return new Vec3(this.offsetX, 0, 0);
    }

    updateOffset(type: number): void {
        this.offsetX -= CONSTANTS.CAR_POSITION_OFFSET * type;
    }

    reset(): void {
        this.offsetX = 0;
    }
}

@ccclass('CarManager')
export class CarManager extends Component {
    @property(Node)
    public nodeCar: Node = null; // 汽车父节点

    @property(Prefab)
    public itemCarU1: Prefab = null; // 上方向汽车预制1

    @property(Prefab)
    public itemCarU2: Prefab = null; // 上方向汽车预制2

    @property(Prefab)
    public itemCarU3: Prefab = null; // 上方向汽车预制3

    @property(Prefab)
    public itemCarL1: Prefab = null; // 左方向汽车预制1

    @property(Prefab)
    public itemCarL2: Prefab = null; // 左方向汽车预制2

    @property(Prefab)
    public itemCarL3: Prefab = null; // 左方向汽车预制3

    @property(Prefab)
    public itemCarR1: Prefab = null; // 右方向汽车预制1

    @property(Prefab)
    public itemCarR2: Prefab = null; // 右方向汽车预制2

    @property(Prefab)
    public itemCarR3: Prefab = null; // 右方向汽车预制3

    @property(UIManager)
    public uiManager: UIManager = null; // UI管理器引用

    private successfulParks: number = 0;
    private currentLevel: number = 1;
    private positionStrategies: Map<string, CarPositionStrategy> = new Map();
    private nodeSortIndexes: Map<string, number> = new Map();
    private carParkingInfos: CarParkingInfo[] = [];
    private carAnimDuration: number = CONSTANTS.DEFAULT_ANIM_DURATION;
    private isAnimationPlaying: boolean = false;
    
    // 节点名称常量
    private readonly NODE_NAMES = [
        'nodeU0', 'nodeU1', 'nodeU2', 'nodeU3', 'nodeU4',
        'nodeL0', 'nodeL1', 'nodeL2', 'nodeL3', 'nodeL4', 'nodeL5',
        'nodeR0', 'nodeR1', 'nodeR2', 'nodeR3', 'nodeR4', 'nodeR5'
    ] as const;

    /**
     * 初始化汽车
     * @param level 关卡等级
     */
    public initCars(level: number): void {
        if (!this.validateLevel(level)) {
            console.error(`Invalid level: ${level}`);
            return;
        }

        if (!this.nodeCar) {
            console.error('nodeCar is not assigned in CarManager. Please assign the nodeCar property in the inspector.');
            return;
        }

        this.resetGameState(level);
        this.clearExistingCars();
        this.initializeStrategiesAndIndexes();
        
        const carData = MapData.getCarDataByLevel(level);
        if (!carData?.length) {
            console.warn(`No car data for level ${level}`);
            return;
        }

        this.createCars(carData);
    }

    /**
     * 验证关卡等级
     */
    private validateLevel(level: number): boolean {
        return Number.isInteger(level) && level > 0;
    }

    /**
     * 重置游戏状态
     */
    private resetGameState(level: number): void {
        this.currentLevel = level;
        this.successfulParks = 0;
        this.carParkingInfos = [];
        this.isAnimationPlaying = false;
        this.resetAllStrategies();
    }

    /**
     * 清除现有汽车
     */
    private clearExistingCars(): void {
        for (const nodeName of this.NODE_NAMES) {
            const node = this.nodeCar.getChildByName(nodeName);
            if (node) {
                node.removeAllChildren();
            } else {
                console.warn(`Cannot find node ${nodeName} under nodeCar`);
            }
        }
    }

    /**
     * 初始化位置策略和节点索引
     */
    private initializeStrategiesAndIndexes(): void {
        this.positionStrategies.clear();
        this.nodeSortIndexes.clear();

        for (const nodeName of this.NODE_NAMES) {
            this.nodeSortIndexes.set(nodeName, 0);
            
            const strategy = this.createPositionStrategy(nodeName);
            if (strategy) {
                this.positionStrategies.set(nodeName, strategy);
            }
        }
    }

    /**
     * 创建位置策略
     */
    private createPositionStrategy(nodeName: string): CarPositionStrategy | null {
        if (nodeName.includes('U')) {
            return new UpperCarPositionStrategy();
        } else if (nodeName.includes('L')) {
            return new LeftCarPositionStrategy();
        } else if (nodeName.includes('R')) {
            return new RightCarPositionStrategy();
        }
        console.warn(`Unknown node type for ${nodeName}`);
        return null;
    }

    /**
     * 批量创建汽车
     */
    private createCars(carData: Array<{outerMap: string, sort: number, type: number, inPark: number}>): void {
        // 按outerMap和sort排序，确保sort=0的车先创建
        const sortedCarData = carData.sort((a, b) => {
            if (a.outerMap !== b.outerMap) {
                return a.outerMap.localeCompare(b.outerMap);
            }
            return a.sort - b.sort;
        });
        
        for (const car of sortedCarData) {
            try {
                this.createCar(car);
            } catch (error) {
                console.error(`Failed to create car:`, car, error);
            }
        }
    }

    /**
     * 创建单个汽车
     */
    private createCar(car: {outerMap: string, sort: number, type: number, inPark: number}): void {
        const {outerMap, sort, type} = car;
        
        if (!this.validateCarData(car)) {
            throw new Error(`Invalid car data: ${JSON.stringify(car)}`);
        }

        const nodeName = `node${outerMap}`;
        const parentNode = this.nodeCar.getChildByName(nodeName);

        if (!parentNode) {
            throw new Error(`Cannot find parent node: ${nodeName} under nodeCar`);
        }

        const carPrefab = this.getCarPrefab(outerMap, type);
        if (!carPrefab) {
            throw new Error(`Cannot get car prefab for ${outerMap}, type ${type}`);
        }

        const carNode = instantiate(carPrefab);
        if (!carNode) {
            throw new Error(`Failed to instantiate car prefab for type ${type}`);
        }

        parentNode.addChild(carNode);
        this.updateNodeSortIndex(nodeName);
        this.setCarPosition(nodeName, carNode, type);
        
        const parkingInfo = this.calculateParkingInfo(outerMap, sort, type, carNode, car.inPark);
        this.carParkingInfos.push(parkingInfo);
        this.setupCarClickEvents(carNode, parentNode, type, sort);
    }

    /**
     * 验证汽车数据
     */
    private validateCarData(car: {outerMap: string, sort: number, type: number, inPark: number}): boolean {
        const {outerMap, sort, type} = car;
        return outerMap && 
               typeof sort === 'number' && sort >= 0 &&
               typeof type === 'number' && type >= CONSTANTS.MIN_CAR_TYPE && type <= CONSTANTS.MAX_CAR_TYPE;
    }

    /**
     * 更新节点排序索引
     */
    private updateNodeSortIndex(nodeName: string): void {
        const currentIndex = this.nodeSortIndexes.get(nodeName) || 0;
        this.nodeSortIndexes.set(nodeName, currentIndex + 1);
    }

    /**
     * 计算汽车停放信息
     */
    private calculateParkingInfo(outerMap: string, sort: number, type: number, carNode: Node, inPark: number): CarParkingInfo {
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        if (!mapData) {
            throw new Error(`Cannot get map data for level ${this.currentLevel}`);
        }

        let headMap = 0;
        let tailMap = 0;

        // 根据方向计算初始位置
        if (outerMap.startsWith(CarDirection.UP)) {
            headMap = mapData.MapH;
            tailMap = headMap + type - 1;
        } else if (outerMap.startsWith(CarDirection.LEFT)) {
            headMap = mapData.MapW;
            tailMap = headMap + type - 1;
        } else if (outerMap.startsWith(CarDirection.RIGHT)) {
            headMap = -1;
            tailMap = headMap - type + 1;
        }

        // 考虑sort位置
        if (sort > 0) {
            const prevInfo = this.carParkingInfos.find(info => 
                info.outerMap === outerMap && info.sort === sort - 1
            );
            
            if (prevInfo) {
                if (outerMap.startsWith(CarDirection.UP) || outerMap.startsWith(CarDirection.LEFT)) {
                    headMap = prevInfo.tailMap + 1;
                    tailMap = headMap + type - 1;
                } else if (outerMap.startsWith(CarDirection.RIGHT)) {
                    headMap = prevInfo.tailMap - 1;
                    tailMap = headMap - type + 1;
                }
            }
        }

        return {
            outerMap,
            sort,
            type,
            headMap,
            tailMap,
            node: carNode,
            inPark: inPark
        };
    }

    /**
     * 获取汽车预制体
     */
    private getCarPrefab(outerMap: string, type: number): Prefab | null {
        const carPrefabMap = new Map([
            [`${CarDirection.UP}1`, this.itemCarU1],
            [`${CarDirection.UP}2`, this.itemCarU2],
            [`${CarDirection.UP}3`, this.itemCarU3],
            [`${CarDirection.LEFT}1`, this.itemCarL1],
            [`${CarDirection.LEFT}2`, this.itemCarL2],
            [`${CarDirection.LEFT}3`, this.itemCarL3],
            [`${CarDirection.RIGHT}1`, this.itemCarR1],
            [`${CarDirection.RIGHT}2`, this.itemCarR2],
            [`${CarDirection.RIGHT}3`, this.itemCarR3]
        ]);

        const direction = outerMap.charAt(0) as CarDirection;
        const key = `${direction}${type}`;
        const prefab = carPrefabMap.get(key);
        
        if (!prefab) {
            console.error(`No car prefab found for direction: ${direction}, type: ${type}`);
        }
        
        return prefab || null;
    }

    /**
     * 设置汽车位置
     */
    private setCarPosition(nodeName: string, carNode: Node, type: number): void {
        const strategy = this.positionStrategies.get(nodeName);
        if (!strategy) {
            throw new Error(`No position strategy found for node: ${nodeName}`);
        }

        const sortIndex = this.nodeSortIndexes.get(nodeName) || 0;
        const position = strategy.calculatePosition(sortIndex, type);
        carNode.setPosition(position);
        strategy.updateOffset(type);
    }

    /**
     * 设置汽车点击事件
     */
    private setupCarClickEvents(carNode: Node, parentNode: Node, type: number, sort: number): void {
        carNode.on(Node.EventType.TOUCH_END, () => {
            this.handleCarClick(carNode, parentNode, type, sort);
        }, this);
    }

    /**
     * 处理汽车点击逻辑
     */
    private handleCarClick(carNode: Node, parentNode: Node, type: number, sort: number): void {
        if (this.isAnimationPlaying) {
            return;
        }

        const outerMap = parentNode.name.replace('node', '');
        const parkingInfo = this.findCarParkingInfo(outerMap, sort, type);
        
        if (!parkingInfo) {
            console.warn(`Car parking info not found for ${outerMap}, sort: ${sort}, type: ${type}`);
            return;
        }

        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        if (!mapData) {
            console.error(`Map data not found for level ${this.currentLevel}`);
            return;
        }

        const movementStatus = this.calculateMovementStatus(parkingInfo, mapData, outerMap);
        this.executeCarMovement(carNode, parkingInfo, mapData, outerMap, movementStatus);
    }

    /**
     * 查找汽车停放信息
     */
    private findCarParkingInfo(outerMap: string, sort: number, type: number): CarParkingInfo | null {
        return this.carParkingInfos.find(info => 
            info.outerMap === outerMap && 
            info.sort === sort && 
            info.type === type
        ) || null;
    }

    /**
     * 计算汽车移动状态
     */
    private calculateMovementStatus(parkingInfo: CarParkingInfo, mapData: any, outerMap: string): CarMovementStatus {
        if (outerMap.startsWith(CarDirection.UP)) {
            return this.calculateUpCarMovementStatus(parkingInfo, mapData, outerMap);
        } else if (outerMap.startsWith(CarDirection.LEFT)) {
            return this.calculateLeftCarMovementStatus(parkingInfo, mapData, outerMap);
        } else if (outerMap.startsWith(CarDirection.RIGHT)) {
            return this.calculateRightCarMovementStatus(parkingInfo, mapData, outerMap);
        }
        return CarMovementStatus.CANNOT_MOVE;
    }

    /**
     * 计算上方向汽车移动状态
     */
    private calculateUpCarMovementStatus(parkingInfo: CarParkingInfo, mapData: any, outerMap: string): CarMovementStatus {
        const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
        const map = mapData.Map;
        const mapH = mapData.MapH;

        console.log("汽车属于下方");

        const canMoveUp = this.canCarMoveUp(parkingInfo, map, x);
        
        // 使用canCarMoveUp方法的结果来判断是否可以向上开
        if (!canMoveUp) {
            console.log("汽车不可以向上开");
            
            // 检查是否可以向下开
            const tailBelowRow = parkingInfo.tailMap + 1;
            const headAlreadyOutside = parkingInfo.headMap < 0;
            const carAlreadyOutside = parkingInfo.headMap >= mapH; // 汽车已经在停车场外
            
            // 车尾下面一格是停车场内 并且 车尾下面一格不是0
            const tailBelowBlocked = (tailBelowRow < mapH && map[tailBelowRow][x] !== 0);
            
            if (tailBelowBlocked || headAlreadyOutside || carAlreadyOutside) {
                console.log("汽车也不可以向下开");
                return CarMovementStatus.CANNOT_MOVE;
            } else {
                console.log("汽车可以向下开");
                
                // 检查汽车会停在哪里
                let carStopsOutside = true;
                for (let index = parkingInfo.tailMap + 1; index < mapH; index++) {
                    if (map[index][x] !== 0) {
                        console.log(`车尾会停在${index - 1}`, "汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。");
                        carStopsOutside = false;
                        break;
                    }
                }
                
                if (carStopsOutside) {
                    console.log("Ux的汽车会停在停车场外，和Ux相同且Sort比它大的车一起撤出停车场。");
                    return CarMovementStatus.CAN_MOVE_DOWN_OUT_PARK;
                } else {
                    return CarMovementStatus.CAN_MOVE_DOWN_IN_PARK;
                }
            }
        } else {
            console.log("汽车可以向上开");
            
            // 寻找车头新位置
            let newHeadPos = parkingInfo.headMap - 1;
            for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
                if (map[index][x] !== 0) {
                    break;
                }
                newHeadPos = index;
            }
            
            console.log(`车头会停在${newHeadPos}`);
            return CarMovementStatus.CAN_MOVE_UP;
        }
    }

    /**
     * 计算左方向汽车移动状态
     */
    private calculateLeftCarMovementStatus(parkingInfo: CarParkingInfo, mapData: any, outerMap: string): CarMovementStatus {
        // TODO: 实现左方向汽车移动逻辑
        return CarMovementStatus.CANNOT_MOVE;
    }

    /**
     * 计算右方向汽车移动状态
     */
    private calculateRightCarMovementStatus(parkingInfo: CarParkingInfo, mapData: any, outerMap: string): CarMovementStatus {
        const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
        const map = mapData.Map;
        const mapW = mapData.MapW;

        console.log("汽车属于左方");

        const canMoveRight = this.canCarMoveRight(parkingInfo, map, x, mapW);
        
        // 使用canCarMoveRight方法的结果来判断是否可以向右开
        if (!canMoveRight) {
            console.log("汽车不可以向右开");
            
            // 检查是否可以向左开
            const tailLeftCol = parkingInfo.tailMap - 1;
            const headAlreadyOutside = parkingInfo.headMap < 0;
            
            // 车尾左边一格是停车场内 并且 车尾左边一格不是0
            const tailLeftBlocked = (tailLeftCol >= 0 && tailLeftCol < mapW && map[x][tailLeftCol] !== 0);
            
            if (tailLeftBlocked || headAlreadyOutside) {
                console.log("汽车也不可以向左开");
                return CarMovementStatus.CANNOT_MOVE;
            } else {
                console.log("汽车可以向左开");
                
                // 先定义 汽车停场外=true，遍历 index 从车尾-1 到 0
                let carStopsOutside = true;
                for (let index = parkingInfo.tailMap - 1; index >= 0; index--) {
                    if (map[x][index] !== 0) {
                        // （14.2.1.2.1）打印 车尾会停在index+1 和 "汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。"，汽车停场外=false，跳出循环。
                        console.log(`车尾会停在${index + 1}`, "汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。");
                        carStopsOutside = false;
                        break;
                    }
                }
                
                // 循环结束，（14.2.1.2.2）如果 汽车停场外 = true，打印"Rx的汽车会停在停车场外，和Rx相同且Sort比它大的车一起撤出停车场。"
                if (carStopsOutside) {
                    console.log("Rx的汽车会停在停车场外，和Rx相同且Sort比它大的车一起撤出停车场。");
                    return CarMovementStatus.CAN_MOVE_LEFT_OUT_PARK;
                } else {
                    return CarMovementStatus.CAN_MOVE_LEFT_IN_PARK;
                }
            }
        } else {
            console.log("汽车可以向右开");
            
            // 先定义 汽车车头新位置=车头+1，遍历 index 从车头+1 到 mapW-1
            let newHeadPos = parkingInfo.headMap + 1;
            for (let index = parkingInfo.headMap + 1; index < mapW; index++) {
                if (map[x][index] !== 0) {
                    break;
                }
                // 否则 汽车车头新位置=index
                newHeadPos = index;
            }
            
            // 循环结束，打印 车头会停在汽车车头新位置
            console.log(`车头会停在${newHeadPos}`);
            return CarMovementStatus.CAN_MOVE_RIGHT;
        }
    }

    /**
     * 检查汽车是否可以向上移动
     */
    private canCarMoveUp(parkingInfo: CarParkingInfo, map: number[][], x: number): boolean {
        if (parkingInfo.headMap === 0) {
            return false;
        }
        
        const rowIndex = parkingInfo.headMap - 1;
        if (!this.isValidMapPosition(map, rowIndex, x) || map[rowIndex][x] !== 0) {
            return false;
        }
        
        // 检查汽车是否在停车场外且它上方有车
        const mapH = map.length;
        const isCarOutsidePark = parkingInfo.headMap >= mapH;
        if (isCarOutsidePark) {
            // 检查上方是否有车（需要考虑上方位置也可能在停车场外）
            const upperPosition = parkingInfo.headMap - 1;
            if (upperPosition >= 0) {
                // 如果上方位置在停车场内，检查map
                if (upperPosition < mapH && map[upperPosition][x] !== 0) {
                    return false;
                }
                // 如果上方位置也在停车场外，检查是否有其他车辆占据该位置
                if (upperPosition >= mapH) {
                    const hasCarAbove = this.carParkingInfos.some(carInfo => 
                        carInfo.outerMap === parkingInfo.outerMap && 
                        carInfo !== parkingInfo && // 排除自己
                        carInfo.headMap <= upperPosition && 
                        carInfo.tailMap >= upperPosition
                    );
                    if (hasCarAbove) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * 检查汽车是否可以向下移动
     */
    private canCarMoveDown(parkingInfo: CarParkingInfo, map: number[][], x: number, mapH: number): boolean {
        if (parkingInfo.headMap < 0) {
            return false;
        }
        
        const tailRowIndex = parkingInfo.tailMap + 1;
        return tailRowIndex < mapH && 
               this.isValidMapPosition(map, tailRowIndex, x) && 
               map[tailRowIndex][x] === 0;
    }

    /**
     * 检查汽车是否可以向右移动
     */
    private canCarMoveRight(parkingInfo: CarParkingInfo, map: number[][], x: number, mapW: number): boolean {
        // 如果车头已经在地图右边界，不能向右移动
        if (parkingInfo.headMap === mapW - 1) {
            return false;
        }
        
        // 检查车头右边一格是否被占用
        const rightColIndex = parkingInfo.headMap + 1;
        if (!this.isValidMapPosition(map, x, rightColIndex) || map[x][rightColIndex] !== 0) {
            return false;
        }
        
        // 检查汽车是否在停车场外且它右边有车
        // 对于Rx汽车，停车场外包括左侧（headMap < 0）和右侧（headMap >= mapW）
        const isCarOutsidePark = parkingInfo.headMap < 0 || parkingInfo.headMap >= mapW;
        if (isCarOutsidePark) {
            // 检查右边是否有车（需要考虑右边位置也可能在停车场外）
            const rightPosition = parkingInfo.headMap + 1;
            
            // 如果右边位置在停车场内，检查map
            if (rightPosition >= 0 && rightPosition < mapW && map[x][rightPosition] !== 0) {
                console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}右边位置${rightPosition}在停车场内被占用`);
                return false;
            }
            
            // 如果右边位置也在停车场外，检查是否有其他车辆占据该位置
            if (rightPosition < 0 || rightPosition >= mapW) {
                const hasCarRight = this.carParkingInfos.some(carInfo => 
                    carInfo.outerMap === parkingInfo.outerMap && 
                    carInfo !== parkingInfo && // 排除自己
                    carInfo.headMap <= rightPosition && 
                    carInfo.tailMap >= rightPosition
                );
                if (hasCarRight) {
                    console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}右边位置${rightPosition}在停车场外被其他汽车占用`);
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * 检查地图位置是否有效
     */
    private isValidMapPosition(map: number[][], row: number, col: number): boolean {
        return row >= 0 && row < map.length && 
               col >= 0 && col < map[row].length;
    }

    /**
     * 执行汽车移动
     */
    private executeCarMovement(
        carNode: Node, 
        parkingInfo: CarParkingInfo, 
        mapData: any, 
        outerMap: string, 
        movementStatus: CarMovementStatus
    ): void {
        if (movementStatus === CarMovementStatus.CANNOT_MOVE) {
            return;
        }

        if (outerMap.startsWith(CarDirection.UP)) {
            this.executeUpCarMovement(carNode, parkingInfo, mapData, outerMap, movementStatus);
        } else if (outerMap.startsWith(CarDirection.RIGHT)) {
            this.executeRightCarMovement(carNode, parkingInfo, mapData, outerMap, movementStatus);
        }
        // TODO: 实现左方向的移动逻辑
    }

    /**
     * 执行上方向汽车移动
     */
    private executeUpCarMovement(
        carNode: Node, 
        parkingInfo: CarParkingInfo, 
        mapData: any, 
        outerMap: string, 
        movementStatus: CarMovementStatus
    ): void {
        const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
        const map = mapData.Map;
        const mapH = mapData.MapH;

        if (movementStatus === CarMovementStatus.CAN_MOVE_UP) {
            this.moveCarUp(carNode, parkingInfo, map, x);
        } else if (movementStatus === CarMovementStatus.CAN_MOVE_DOWN_IN_PARK) {
            this.moveCarDown(carNode, parkingInfo, map, x, mapH);
        } else if (movementStatus === CarMovementStatus.CAN_MOVE_DOWN_OUT_PARK) {
            this.moveCarDownOutPark(carNode, parkingInfo, map, x, mapH, outerMap);
        }
    }

    /**
     * 执行右方向汽车移动
     */
    private executeRightCarMovement(
        carNode: Node, 
        parkingInfo: CarParkingInfo, 
        mapData: any, 
        outerMap: string, 
        movementStatus: CarMovementStatus
    ): void {
        const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
        const map = mapData.Map;
        const mapW = mapData.MapW;

        if (movementStatus === CarMovementStatus.CAN_MOVE_LEFT || 
            movementStatus === CarMovementStatus.CAN_MOVE_LEFT_IN_PARK) {
            this.moveCarLeft(carNode, parkingInfo, map, x);
        } else if (movementStatus === CarMovementStatus.CAN_MOVE_LEFT_OUT_PARK) {
            // （14.2.4）Rx的汽车会停在停车场外，和Rx相同且Sort比它大的车一起撤出停车场时，和Rx相同且Sort比它大的车向左开，但要确保和当前点击的汽车相邻
            this.moveCarLeft(carNode, parkingInfo, map, x);
            this.moveSimilarRightCarsWithHigherSortLeft(outerMap, parkingInfo.sort, map, mapW);
        } else if (movementStatus === CarMovementStatus.CAN_MOVE_RIGHT) {
            // 检查是否需要处理连带移动（14.2.3）
            const hasPartOutsidePark = parkingInfo.headMap < 0 || parkingInfo.tailMap >= mapW;
            const hasSimilarCarsWithHigherSort = this.carParkingInfos.some(carInfo => 
                carInfo.outerMap === outerMap && 
                carInfo.sort > parkingInfo.sort
            );
            
            this.moveCarRight(carNode, parkingInfo, map, x);
            
            // （14.2.3）如果汽车向右开时，只要汽车有一部分是在停车场外 且 同Rx里边有sort比当前车大的车，汽车向右开后，Rx里边有sort比当前车大的车也要一起尽量向右开，但Rx里边有sort比当前车大的车不会开进停车场。
            if (hasPartOutsidePark && hasSimilarCarsWithHigherSort) {
                this.moveSimilarRightCarsWithHigherSortRight(outerMap, parkingInfo.sort, map, mapW);
            }
        }
    }

    /**
     * 向上移动汽车
     */
    private moveCarUp(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number): void {
        const oldHead = parkingInfo.headMap;
        let newHeadPos = parkingInfo.headMap - 1;
        const mapH = map.length;

        // 寻找新的车头位置
        for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
            if (this.isValidMapPosition(map, index, x) && map[index][x] !== 0) {
                break;
            }
            newHeadPos = index;
        }

        // 检查汽车是否有部分在停车场外
        const hasPartOutsidePark = parkingInfo.tailMap >= mapH;
        
        // 如果汽车有部分在停车场外，处理相同Ux中sort比当前车大的车一起向上移动
        if (hasPartOutsidePark) {
            this.moveSimilarCarsWithHigherSortUp(parkingInfo.outerMap, parkingInfo.sort, map, mapH);
        }

        // 更新停放信息
        parkingInfo.headMap = newHeadPos;
        parkingInfo.tailMap = newHeadPos + parkingInfo.type - 1;

        // 打印汽车移动后的位置
        console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);

        // 更新地图数据
        this.updateMapForCarMovement(map, newHeadPos, parkingInfo.tailMap, oldHead, oldHead + parkingInfo.type - 1, x, parkingInfo.type);

        // 判断停车状态变化
        const wasOutsidePark = oldHead >= mapH;
        const isNowInsidePark = parkingInfo.tailMap < mapH;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        if (wasOutsidePark && isNowInsidePark) {
            parkingStatusChange = 'enter';
            console.log("汽车从停车场外完全进入停车场内");
        }
        
        // 播放动画
        this.playCarMoveAnimation(carNode, new Vec3(0, CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPos), 0), parkingStatusChange);
    }

    /**
     * 向下移动汽车
     */
    private moveCarDown(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number, mapH: number): void {
        let carStopsOutside = true;
        let stopIndex = mapH;

        // 检查车尾+1到mapH-1的位置
        for (let index = parkingInfo.tailMap + 1; index < mapH; index++) {
            if (this.isValidMapPosition(map, index, x) && map[index][x] !== 0) {
                carStopsOutside = false;
                stopIndex = index;
                break;
            }
        }

        const oldHead = parkingInfo.headMap;
        
        if (carStopsOutside) {
            // 汽车停在停车场外
            parkingInfo.headMap = parkingInfo.tailMap + 1;
            parkingInfo.tailMap = mapH - 1;
            
            // 打印汽车移动后的位置
            console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);
            
            // 清除原位置
            for (let i = oldHead; i < oldHead + parkingInfo.type; i++) {
                if (this.isValidMapPosition(map, i, x)) {
                    map[i][x] = 0;
                }
            }
        } else {
            // 汽车停在停车场内
            parkingInfo.headMap = parkingInfo.tailMap + 1;
            parkingInfo.tailMap = stopIndex - 1;
            
            // 打印汽车移动后的位置
            console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);
            
            // 更新地图数据
            this.updateMapForCarMovement(map, parkingInfo.headMap, parkingInfo.tailMap, oldHead, oldHead + parkingInfo.type - 1, x, parkingInfo.type);
        }

        // 移动相同Ux且Sort比它大的车，确保相邻
        this.moveSimilarCarsWithHigherSortDown(parkingInfo.outerMap, parkingInfo.sort, map, mapH, parkingInfo.tailMap);

        
        // 判断停车状态变化 - 向下移动进入停车场
        const wasOutsidePark = oldHead >= mapH;
        const isNowInsidePark = parkingInfo.tailMap < mapH;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        if (wasOutsidePark && isNowInsidePark) {
            parkingStatusChange = 'enter';
            console.log("汽车向下移动从停车场外完全进入停车场内");
        }
        
        // 播放动画
        const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (parkingInfo.headMap - oldHead);
        this.playCarMoveAnimation(carNode, new Vec3(0, moveDistance, 0), parkingStatusChange);
    }

    /**
     * 向左移动汽车
     */
    private moveCarLeft(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number): void {
        console.log("汽车可以向左开");
        
        const mapW = map[0].length;
        let carStopsOutside = true;
        let stopIndex = -1;

        // 先清除汽车在地图上的当前位置，避免检查到自己
        console.log(`清除汽车当前位置: 车头=${parkingInfo.headMap}, 车尾=${parkingInfo.tailMap}`);
        // 对于Rx汽车，车头index比车尾index大，所以需要从车尾到车头遍历
        for (let i = parkingInfo.tailMap; i <= parkingInfo.headMap; i++) {
            if (this.isValidMapPosition(map, x, i)) {
                console.log(`清除位置[${x}][${i}]，原值=${map[x][i]}`);
                map[x][i] = 0;
            }
        }
        
        // 对于右方向汽车向左移动，检查从车头位置开始向左的障碍物
        // 从车头位置开始向左检查，直到位置0
        console.log(`开始障碍物检查: 车头=${parkingInfo.headMap}, 车尾=${parkingInfo.tailMap}`);
        for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
            console.log(`检查位置${index}: 是否有效=${this.isValidMapPosition(map, x, index)}, 值=${this.isValidMapPosition(map, x, index) ? map[x][index] : 'N/A'}`);
            if (this.isValidMapPosition(map, x, index) && map[x][index] !== 0) {
                console.log(`在位置${index}发现障碍物，车头会停在${index + 1}`);
                console.log("汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。");
                carStopsOutside = false;
                stopIndex = index + 1; // 车头停在障碍物右侧
                break;
            }
        }
        
        console.log(`障碍物检查完成: carStopsOutside=${carStopsOutside}, stopIndex=${stopIndex}`);

        const oldTail = parkingInfo.tailMap;
        const oldHead = parkingInfo.headMap;
        
        if (carStopsOutside) {
            // 汽车停在停车场外
            console.log("Rx的汽车会停在停车场外，和Rx相同且Sort比它大的车一起撤出停车场。");
            
            // 根据需求14.2.4，汽车撤出停车场时的正确位置计算：
            // R0sort0: 车头=-1，车尾=-2
            // R0sort1: 车头=-3，车尾=-3
            parkingInfo.headMap = -1;
            parkingInfo.tailMap = parkingInfo.headMap - parkingInfo.type + 1;
            
            // 清除原位置
            // 对于Rx汽车，车头index比车尾index大，所以需要从车尾到车头遍历
            for (let i = oldTail; i <= oldHead; i++) {
                if (this.isValidMapPosition(map, x, i)) {
                    map[x][i] = 0;
                }
            }
            
            // 汽车撤出停车场外，不在地图上设置新位置（因为位置超出地图范围）
            console.log(`汽车撤出停车场外，新位置: 车头=${parkingInfo.headMap}, 车尾=${parkingInfo.tailMap}`);
        } else {
            // 汽车停在停车场内
            parkingInfo.headMap = stopIndex;
            // 对于Rx汽车，车头index比车尾index大，所以车尾 = 车头 - type + 1
            parkingInfo.tailMap = parkingInfo.headMap - parkingInfo.type + 1;
            
            console.log(`汽车停在停车场内，新位置: 车头=${parkingInfo.headMap}, 车尾=${parkingInfo.tailMap}`);
            
            // 更新地图数据
            this.updateMapForRightCarMovement(map, parkingInfo.headMap, parkingInfo.tailMap, oldHead, oldTail, x, parkingInfo.type);
        }

        // 判断停车状态变化 - 向左移动
        const wasOutsidePark = oldHead >= mapW;
        const isNowInsidePark = parkingInfo.tailMap < mapW;
        const wasInsidePark = oldTail < mapW;
        const isNowOutsidePark = parkingInfo.headMap >= mapW;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        if (wasInsidePark && isNowOutsidePark) {
            parkingStatusChange = 'exit';
            console.log("汽车向左移动从停车场内完全撤出到停车场外");
            parkingInfo.inPark = 0;
            this.updateParkingCount('exit');
        }

        // 检查是否需要触发联动移动：原本在停车场外或现在撤出到停车场外
        const isPartiallyOutside = oldHead >= mapW || oldTail >= mapW;
        const isExitingPark = parkingStatusChange === 'exit';
        if (isPartiallyOutside || isExitingPark) {
            console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}触发联动移动: isPartiallyOutside=${isPartiallyOutside}, isExitingPark=${isExitingPark}`);
            // 移动相同Rx且Sort比它大的车
            this.moveSimilarRightCarsWithHigherSortLeft(parkingInfo.outerMap, parkingInfo.sort, map, mapW);
        }
        
        if (wasOutsidePark && isNowInsidePark) {
            parkingStatusChange = 'enter';
            console.log("汽车向左移动从停车场外完全进入停车场内");
            parkingInfo.inPark = 1;
            console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}进入停车场，inPark更新为1`);
            this.updateParkingCount('enter');
        }
        
        // 播放动画
        const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (oldTail - parkingInfo.tailMap);
        this.playCarMoveAnimation(carNode, new Vec3(moveDistance, 0, 0), parkingStatusChange);
    }

    /**
     * 向右移动汽车
     */
    private moveCarRight(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number): void {
        console.log(`=== 开始移动汽车${parkingInfo.outerMap}sort${parkingInfo.sort} ===`);
        console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}可以向右开`);
        
        const mapW = map[0].length;
        let newHeadPosition = parkingInfo.headMap + 1;
        
        // 遍历从车头+1到mapW-1，找到新的车头位置
        // 需要同时检查停车场内的地图数据和停车场外其他汽车的位置
        for (let index = parkingInfo.headMap + 1; index < mapW; index++) {
            // 检查停车场内是否被占用
            if (this.isValidMapPosition(map, x, index) && map[x][index] !== 0) {
                console.log(`位置${index}在停车场内被占用，停止搜索`);
                break;
            }
            
            // 检查停车场外是否有其他汽车占据该位置
            let isOccupiedByOutsideCar = false;
            for (const otherCar of this.carParkingInfos) {
                if (otherCar.outerMap === parkingInfo.outerMap && 
                    otherCar.sort !== parkingInfo.sort &&
                    otherCar.inPark === 0) { // 只检查停车场外的汽车
                    // 检查其他汽车是否占据当前检查的位置
                    if (otherCar.headMap === index || 
                        (otherCar.headMap <= index && otherCar.tailMap >= index)) {
                        console.log(`位置${index}被停车场外汽车${otherCar.outerMap}sort${otherCar.sort}占用，停止搜索`);
                        isOccupiedByOutsideCar = true;
                        break;
                    }
                }
            }
            
            if (isOccupiedByOutsideCar) {
                break;
            }
            
            newHeadPosition = index;
            console.log(`位置${index}可用，继续搜索`);
        }
        
        console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}车头会停在${newHeadPosition}`);
        
        const oldHead = parkingInfo.headMap;
        const oldTail = parkingInfo.tailMap;
        
        // 打印汽车当前位置状态
        const isCurrentlyOutside = oldHead < 0 || oldTail < 0 || oldHead >= mapW || oldTail >= mapW;
        console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}当前位置: 车头=${oldHead}, 车尾=${oldTail}, mapW=${mapW}`);
        console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}当前${isCurrentlyOutside ? '在停车场外' : '在停车场内'}`);
        
        // 检查汽车是否有一部分在停车场外
        const isPartiallyOutside = oldHead < 0 || oldTail < 0 || oldHead >= mapW || oldTail >= mapW;
        
        // 更新汽车位置
        parkingInfo.headMap = newHeadPosition;
        // 对于Rx汽车，车头index比车尾index大，所以车尾 = 车头 - type + 1
        parkingInfo.tailMap = newHeadPosition - parkingInfo.type + 1;
        
        // 打印汽车移动后位置状态
        const willBeInside = parkingInfo.headMap >= 0 && parkingInfo.tailMap >= 0 && parkingInfo.headMap < mapW && parkingInfo.tailMap < mapW;
        console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}移动后位置: 车头=${parkingInfo.headMap}, 车尾=${parkingInfo.tailMap}`);
        console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}移动后${willBeInside ? '在停车场内' : '在停车场外'}`);
        
        // 更新地图数据
        this.updateMapForRightCarMovement(map, parkingInfo.headMap, parkingInfo.tailMap, oldHead, oldTail, x, parkingInfo.type);
        
        // 打印地图更新后的状态
        console.log(`地图更新后，检查位置3和4的状态:`);
        if (this.isValidMapPosition(map, x, 3)) {
            console.log(`位置[${x}][3] = ${map[x][3]}`);
        }
        if (this.isValidMapPosition(map, x, 4)) {
            console.log(`位置[${x}][4] = ${map[x][4]}`);
        }
        
        // 根据需求（14.2.3）：如果汽车向右开时，只要汽车有一部分是在停车场外 且 同Rx里边有sort比当前车大的车，
        // 汽车向右开后，Rx里边有sort比当前车大的车也要一起向右开，但 Rx里边有sort比当前车大的车不会开进停车场。
        console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}检查联动移动条件: isPartiallyOutside=${isPartiallyOutside}`);
        if (isPartiallyOutside) {
            console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}触发联动移动`);
            this.moveSimilarRightCarsWithHigherSortRight(parkingInfo.outerMap, parkingInfo.sort, map, mapW);
        } else {
            console.log(`汽车${parkingInfo.outerMap}sort${parkingInfo.sort}不触发联动移动`);
        }
        
        // 判断停车状态变化 - 向右移动进入停车场
        // 对于Rx汽车，停车场外包括左侧（<0）和右侧（>=mapW）
        const wasOutsidePark = oldHead < 0 || oldTail < 0 || oldHead >= mapW || oldTail >= mapW;
        const isNowInsidePark = parkingInfo.headMap >= 0 && parkingInfo.tailMap >= 0 && parkingInfo.headMap < mapW && parkingInfo.tailMap < mapW;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        console.log(`停车状态判断: wasOutsidePark=${wasOutsidePark}, isNowInsidePark=${isNowInsidePark}`);
        
        if (wasOutsidePark && isNowInsidePark) {
            parkingStatusChange = 'enter';
            parkingInfo.inPark = 1; // 更新inPark状态为在停车场内
            console.log("汽车向右移动从停车场外完全进入停车场内，parkingStatusChange=enter，inPark更新为1");
        } else {
            console.log(`汽车向右移动不触发停车状态变化，parkingStatusChange=${parkingStatusChange}`);
        }
        
        // 播放动画
        const moveDistance = CONSTANTS.CAR_POSITION_OFFSET * (newHeadPosition - oldHead);
        this.playCarMoveAnimation(carNode, new Vec3(moveDistance, 0, 0), parkingStatusChange);
    }

    /**
     * 向下移动汽车到停车场外
     */
    private moveCarDownOutPark(carNode: Node, parkingInfo: CarParkingInfo, map: number[][], x: number, mapH: number, outerMap: string): void {
        const oldHead = parkingInfo.headMap;
        
        // 汽车停在停车场外
        parkingInfo.headMap = mapH;
        parkingInfo.tailMap = mapH + parkingInfo.type - 1;
        
        // 打印汽车移动后的位置
        console.log(`汽车移动后：车头位置=${parkingInfo.headMap}，车尾位置=${parkingInfo.tailMap}`);
        
        // 清除原位置
        for (let i = oldHead; i < oldHead + parkingInfo.type; i++) {
            if (this.isValidMapPosition(map, i, x)) {
                map[i][x] = 0;
            }
        }
        
        // 移动相同Ux且Sort比它大的车，确保相邻
        this.moveSimilarCarsWithHigherSortDown(outerMap, parkingInfo.sort, map, mapH, parkingInfo.tailMap);
        
        // 判断停车状态变化 - 撤出停车场
        const wasInsidePark = oldHead < mapH;
        const isNowOutsidePark = parkingInfo.headMap >= mapH;
        let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
        
        if (wasInsidePark && isNowOutsidePark) {
            parkingStatusChange = 'exit';
            console.log("汽车撤出停车场");
        }
        
        // 播放动画
        const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (parkingInfo.headMap - oldHead);
        this.playCarMoveAnimation(carNode, new Vec3(0, moveDistance, 0), parkingStatusChange);
    }

    /**
     * 移动相同Ux中sort比当前车大的车一起向上移动（但不进入停车场）
     * 根据需求14.1.3：要尽量一起向上开
     */
    private moveSimilarCarsWithHigherSortUp(outerMap: string, currentSort: number, map: number[][], mapH: number): void {
        const carsToMove: CarParkingInfo[] = [];
        
        // 找到相同outerMap且sort比当前车大的车
        for (const carInfo of this.carParkingInfos) {
            if (carInfo.outerMap === outerMap && carInfo.sort > currentSort) {
                carsToMove.push(carInfo);
            }
        }
        
        const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
        
        // 移动这些车（尽量向上移动但不进入停车场）
        for (const carToMove of carsToMove) {
            const oldHead = carToMove.headMap;
            
            // 尽量向上移动：从当前车头-1开始向上遍历，找到最远的可移动位置
            let newHeadPos = carToMove.headMap;
            for (let index = carToMove.headMap - 1; index >= mapH; index--) {
                // 检查这个位置及后续位置是否都可用
                let canMove = true;
                for (let checkPos = index; checkPos < index + carToMove.type; checkPos++) {
                    if (this.isValidMapPosition(map, checkPos, x) && map[checkPos][x] !== 0) {
                        canMove = false;
                        break;
                    }
                }
                
                if (canMove) {
                    newHeadPos = index;
                } else {
                    break;
                }
            }
            
            // 如果没有找到更好的位置，至少确保不进入停车场
            newHeadPos = Math.max(mapH, newHeadPos);
            
            // 清除原位置
            for (let i = carToMove.headMap; i <= carToMove.tailMap; i++) {
                if (this.isValidMapPosition(map, i, x)) {
                    map[i][x] = 0;
                }
            }
            
            // 更新停放信息
            carToMove.headMap = newHeadPos;
            carToMove.tailMap = newHeadPos + carToMove.type - 1;
            
            // 设置新位置
            for (let i = carToMove.headMap; i <= carToMove.tailMap; i++) {
                if (this.isValidMapPosition(map, i, x)) {
                    map[i][x] = carToMove.sort;
                }
            }
            
            // 打印移动信息
            console.log(`相关车辆尽量向上移动：outerMap=${outerMap}, sort=${carToMove.sort}, 车头位置=${carToMove.headMap}，车尾位置=${carToMove.tailMap}`);
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                this.playCarMoveAnimation(carToMove.node, new Vec3(0, CONSTANTS.CAR_POSITION_OFFSET * (oldHead - newHeadPos), 0), 'none');
            }
        }
    }

    private moveSimilarCarsWithHigherSortDown(outerMap: string, currentSort: number, map: number[][], mapH: number, currentCarTailMap: number): void {
        const carsToMove: CarParkingInfo[] = [];
        
        // 找到相同outerMap且sort比当前车大的车
        for (const carInfo of this.carParkingInfos) {
            if (carInfo.outerMap === outerMap && carInfo.sort > currentSort) {
                carsToMove.push(carInfo);
            }
        }
        
        // 按sort排序，确保按顺序移动
        carsToMove.sort((a, b) => a.sort - b.sort);
        
        // 移动这些车，确保与当前车相邻
        let nextHeadPosition = currentCarTailMap + 1;
        
        for (const carToMove of carsToMove) {
            const oldHead = carToMove.headMap;
            const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
            
            // 从地图上清除原位置
            for (let i = carToMove.headMap; i <= carToMove.tailMap; i++) {
                if (this.isValidMapPosition(map, i, x)) {
                    map[i][x] = 0;
                }
            }
            
            // 更新停放信息，确保相邻
            carToMove.headMap = nextHeadPosition;
            carToMove.tailMap = nextHeadPosition + carToMove.type - 1;
            
            // 打印移动信息
            console.log(`相关车辆向下移动：outerMap=${outerMap}, sort=${carToMove.sort}, 车头位置=${carToMove.headMap}，车尾位置=${carToMove.tailMap}`);
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                const moveDistance = carToMove.headMap - oldHead;
                this.playCarMoveAnimation(carToMove.node, new Vec3(0, -CONSTANTS.CAR_POSITION_OFFSET * moveDistance, 0), 'none');
            }
            
            // 更新下一个车的位置
            nextHeadPosition = carToMove.tailMap + 1;
        }
    }

    /**
     * Rx的汽车会停在停车长外，和Rx相同且Sort比它大的车一起撤出停车场时，
     * 和Rx相同且Sort比它大的车向左开，但要确保和 当前点击的汽车 相邻，即Sort+1的车头刚好在Sort的车尾左边一格。
     */
    private moveSimilarRightCarsWithHigherSortLeft(outerMap: string, currentSort: number, map: number[][], mapW: number): void {
        console.log(`开始联动移动: 查找${outerMap}中sort大于${currentSort}的汽车`);
        // 找到所有相同outerMap且Sort比当前车大的车
        const carsToMove = this.carParkingInfos.filter(info => 
            info.outerMap === outerMap && 
            info.sort > currentSort
        ).sort((a, b) => a.sort - b.sort); // 按sort升序排列

        console.log(`找到${carsToMove.length}辆需要联动移动的汽车:`, carsToMove.map(car => `${car.outerMap}sort${car.sort}`));

        // 找到当前车的信息
        const currentCar = this.carParkingInfos.find(info => 
            info.outerMap === outerMap && 
            info.sort === currentSort
        );
        
        if (!currentCar) return;
        
        const x = this.getCarRowPosition(outerMap);
        // 参考moveSimilarCarsWithHigherSortDown的逻辑，R0sort1需要根据R0sort0的type向左移动2格
        // 当前车(R0sort0)车尾=-2，所以R0sort1车头应该是-2-1=-3
        let nextHeadPosition = currentCar.tailMap - 1;
        
        for (const carToMove of carsToMove) {
            // 只处理在停车场外的车辆
            if (carToMove.inPark !== 0) {
                console.log(`汽车${carToMove.outerMap}sort${carToMove.sort}在停车场内，跳过联动移动`);
                continue;
            }
            
            const oldHead = carToMove.headMap;
            
            console.log(`相关车辆向左移动：outerMap=${outerMap}, sort=${carToMove.sort}, 原车头位置=${carToMove.headMap}，原车尾位置=${carToMove.tailMap}`);
            
            // 从地图上清除原位置
            for (let i = 0; i < map[x].length; i++) {
                if (map[x][i] === carToMove.sort) {
                    map[x][i] = 0;
                }
            }
            
            // 更新停放信息，确保相邻
            carToMove.headMap = nextHeadPosition;
            carToMove.tailMap = nextHeadPosition - carToMove.type + 1;
            
            console.log(`相关车辆向左移动：outerMap=${outerMap}, sort=${carToMove.sort}, 新车头位置=${carToMove.headMap}，新车尾位置=${carToMove.tailMap}`);
            
            // 检查新位置是否在停车场外
            const isNowOutsidePark = carToMove.headMap < 0;
            let parkingStatusChange: 'enter' | 'exit' | 'none' = 'none';
            
            if (carToMove.inPark !== 0 && isNowOutsidePark) {

                // 从停车场内撤出到停车场外
                carToMove.inPark = 0;
                parkingStatusChange = 'exit';
                console.log(`汽车${carToMove.outerMap}sort${carToMove.sort}联动撤出停车场，inPark更新为0`);
            }
            
            // 设置新位置（如果在停车场内）
            for (let i = carToMove.headMap; i <= carToMove.tailMap; i++) {
                if (this.isValidMapPosition(map, x, i)) {
                    map[x][i] = carToMove.sort;
                }
            }
            
            // 播放动画
            if (carToMove.node && carToMove.node.isValid) {
                const moveDistance = -CONSTANTS.CAR_POSITION_OFFSET * (oldHead - carToMove.headMap);
                this.playCarMoveAnimation(carToMove.node, new Vec3(moveDistance, 0, 0), parkingStatusChange);
            }
            
            // 更新停车计数
            if (parkingStatusChange !== 'none') {
                this.updateParkingCount(parkingStatusChange);
            }
            
            // 更新下一个车的位置
            nextHeadPosition = carToMove.tailMap - 1;
        }
    }

    /**
     * 移动相同Rx且Sort比它大的车向右
     * 根据需求（14.2.3）：汽车向右开后，Rx里边有sort比当前车大的车也要一起向右开，但不会开进停车场
     */
    private moveSimilarRightCarsWithHigherSortRight(outerMap: string, currentSort: number, map: number[][], mapW: number): void {
        console.log(`开始联动移动: 查找${outerMap}中sort大于${currentSort}的汽车`);
        // 找到所有相同outerMap且Sort比当前车大的车
        const carsToMove = this.carParkingInfos.filter(info => 
            info.outerMap === outerMap && 
            info.sort > currentSort
        ).sort((a, b) => a.sort - b.sort); // 按sort升序排列

        console.log(`找到${carsToMove.length}辆需要联动移动的汽车:`, carsToMove.map(car => `${car.outerMap}sort${car.sort}`));

        for (const carInfo of carsToMove) {
            // 检查汽车是否在停车场外
            const isOutsidePark = carInfo.inPark === 0;
            console.log(`汽车${carInfo.outerMap}sort${carInfo.sort}: inPark=${carInfo.inPark}, isOutsidePark=${isOutsidePark}`);
            
            if (isOutsidePark) {
                const x = this.getCarRowPosition(carInfo.outerMap);
                const oldHead = carInfo.headMap;
                
                // 尽量向右移动，但不能进入停车场：从当前车头+1开始向右遍历，找到最远的可移动位置
                let newHeadPosition = carInfo.headMap;
                console.log(`汽车${carInfo.outerMap}sort${carInfo.sort}联动移动计算: 当前车头=${carInfo.headMap}, 车型=${carInfo.type}, mapW=${mapW}`);
                
                for (let index = carInfo.headMap + 1; index < map[x].length; index++) {
                    // 检查这个位置及后续位置是否都可用
                    let canMove = true;
                    for (let checkPos = index; checkPos < index + carInfo.type; checkPos++) {
                        if (this.isValidMapPosition(map, x, checkPos) && map[x][checkPos] !== 0) {
                            canMove = false;
                            break;
                        }
                    }
                    
                    // 根据规则14.2.3：联动移动的汽车不会开进停车场
                    // 检查移动后是否会进入停车场（车尾位置 >= 0 表示进入停车场）
                    const newTailPosition = index - carInfo.type + 1;
                    const wouldEnterPark = newTailPosition >= 0;
                    
                    console.log(`检查位置${index}: canMove=${canMove}, 新车尾=${newTailPosition}, wouldEnterPark=${wouldEnterPark}`);
                    
                    if (canMove && !wouldEnterPark) {
                        newHeadPosition = index;
                        console.log(`可以移动到位置${index}`);
                    } else {
                        console.log(`不能移动到位置${index}，停止搜索`);
                        break;
                    }
                }
                
                // 如果没有找到更好的位置，保持原位置
                if (newHeadPosition === carInfo.headMap) {
                    continue;
                }
                
                // 清除原位置
                for (let i = 0; i < map[x].length; i++) {
                    if (map[x][i] === carInfo.sort) {
                        map[x][i] = 0;
                    }
                }
                
                // 更新位置
                carInfo.headMap = newHeadPosition;
                carInfo.tailMap = newHeadPosition - carInfo.type + 1;
                
                // 根据规则14.2.3：联动移动的汽车不会开进停车场，所以inPark状态保持为0
                console.log(`汽车${carInfo.outerMap}sort${carInfo.sort}联动移动，保持在停车场外，inPark=${carInfo.inPark}`);
                
                // 设置新位置（如果在停车场内）
                for (let i = carInfo.headMap; i <= carInfo.tailMap; i++) {
                    if (this.isValidMapPosition(map, x, i)) {
                        map[x][i] = carInfo.sort;
                    }
                }
                
                console.log(`汽车${carInfo.outerMap}sort${carInfo.sort}联动移动，从位置${oldHead}移动到${newHeadPosition}`);
                
                // 播放动画
                if (carInfo.node && carInfo.node.isValid) {
                    const moveDistance = CONSTANTS.CAR_POSITION_OFFSET * (newHeadPosition - oldHead);
                    this.playCarMoveAnimation(carInfo.node, new Vec3(moveDistance, 0, 0), 'none');
                }
            } else {
                console.log(`汽车${carInfo.outerMap}sort${carInfo.sort}不在停车场外，跳过联动移动`);
            }
        }
    }

    /**
     * 获取汽车所在行的位置
     */
    private getCarRowPosition(outerMap: string): number {
        // 从outerMap中提取行号，例如 "R0" -> 0, "R1" -> 1
        const match = outerMap.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    /**
     * 更新右方向汽车移动后的地图数据
     */
    private updateMapForRightCarMovement(
        map: number[][], 
        newHead: number, 
        newTail: number, 
        oldHead: number, 
        oldTail: number, 
        x: number, 
        carType: number
    ): void {
        console.log(`更新地图数据: 清除原位置[${oldTail}, ${oldHead}], 设置新位置[${newTail}, ${newHead}]`);
        
        // 清除原位置 - 对于Rx汽车，车尾index <= 车头index
        const clearStart = Math.min(oldHead, oldTail);
        const clearEnd = Math.max(oldHead, oldTail);
        for (let i = clearStart; i <= clearEnd; i++) {
            if (this.isValidMapPosition(map, x, i)) {
                console.log(`清除位置[${x}][${i}]`);
                map[x][i] = 0;
            }
        }
        
        // 设置新位置 - 对于Rx汽车，车尾index <= 车头index
        const setStart = Math.min(newHead, newTail);
        const setEnd = Math.max(newHead, newTail);
        for (let i = setStart; i <= setEnd; i++) {
            if (this.isValidMapPosition(map, x, i)) {
                console.log(`设置位置[${x}][${i}] = ${carType}`);
                map[x][i] = carType;
            }
        }
    }

    /**
     * 更新地图数据
     */
    private updateMapForCarMovement(
        map: number[][], 
        newHead: number, 
        newTail: number, 
        oldHead: number, 
        oldTail: number, 
        x: number, 
        carType: number
    ): void {
        // 清除旧位置
        for (let i = oldHead; i <= oldTail; i++) {
            if (this.isValidMapPosition(map, i, x)) {
                map[i][x] = 0;
            }
        }
        
        // 设置新位置
        for (let i = newHead; i <= newTail; i++) {
            if (this.isValidMapPosition(map, i, x)) {
                map[i][x] = carType;
            }
        }
    }

    /**
     * 播放汽车移动动画
     */
    private playCarMoveAnimation(carNode: Node, targetOffset: Vec3, parkingStatusChange?: 'enter' | 'exit' | 'none'): void {
        this.isAnimationPlaying = true;
        this.moveCarAnimation(carNode, targetOffset, this.carAnimDuration, () => {
            this.isAnimationPlaying = false;
            // 动画播放完毕后根据停车状态更新计数
            this.updateParkingCount(parkingStatusChange);
        });
    }

    /**
     * 汽车移动动画
     */
    private moveCarAnimation(carNode: Node, targetOffset: Vec3, duration: number, callback?: () => void): void {
        const startPosition = carNode.position.clone();
        const targetPosition = startPosition.add(targetOffset);
        
        tween(carNode)
            .to(duration, { position: targetPosition })
            .call(() => {
                if (callback) {
                    callback();
                }
            })
            .start();
    }

    /**
     * 根据停车状态更新计数
     */
    private updateParkingCount(parkingStatusChange?: 'enter' | 'exit' | 'none'): void {
        console.log(`updateParkingCount被调用，参数: ${parkingStatusChange}`);
        console.log(`当前成功停车数: ${this.successfulParks}`);
        
        if (parkingStatusChange === 'enter') {
            this.successfulParks++;
            console.log(`汽车进入停车场，成功停车计数增加到: ${this.successfulParks}`);
        } else if (parkingStatusChange === 'exit') {
            this.successfulParks = Math.max(0, this.successfulParks - 1);
            console.log(`汽车撤出停车场，成功停车计数减少到: ${this.successfulParks}`);
        } else {
            console.log(`停车状态无变化(${parkingStatusChange})，成功停车数保持: ${this.successfulParks}`);
        }
        
        // 检查是否通关
        this.checkLevelComplete();
    }

    /**
     * 检查是否通关
     */
    private checkLevelComplete(): void {
        const totalCars = this.carParkingInfos.length;
        console.log(`当前成功停车数: ${this.successfulParks}, 本关汽车总数: ${totalCars}`);
        
        if (this.successfulParks === totalCars && totalCars > 0) {
            console.log('===== 通关条件达成！所有汽车都已成功停车 =====');
            if (this.uiManager) {
                this.uiManager.showLevelClearOnly();
            } else {
                console.error('UIManager引用未设置，无法显示通关界面');
            }
        }
    }

    /**
     * 增加成功停车计数（保留原方法供外部调用）
     */
    public incrementSuccessfulPark(): void {
        this.successfulParks++;
        console.log(`成功停车计数增加到: ${this.successfulParks}`);
        // 检查是否通关
        this.checkLevelComplete();
    }

    /**
     * 获取成功停车计数
     */
    public getSuccessfulParks(): number {
        return this.successfulParks;
    }

    /**
     * 设置当前关卡
     */
    public setCurrentLevel(level: number): void {
        if (level < 1) {
            console.warn(`Invalid level: ${level}. Level must be >= 1`);
            return;
        }
        this.currentLevel = level;
    }

    /**
     * 获取当前关卡
     */
    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    /**
     * 根据outerMap和sort获取汽车停放信息
     */
    public getCarParkingInfo(outerMap: string, sort: number): CarParkingInfo | null {
        return this.carParkingInfos.find(info => info.outerMap === outerMap && info.sort === sort) || null;
    }

    /**
     * 获取所有汽车停放信息
     */
    public getAllCarParkingInfos(): CarParkingInfo[] {
        return [...this.carParkingInfos]; // 返回副本以防止外部修改
    }

    /**
     * 重置成功停车计数
     */
    public resetSuccessfulParks(): void {
        this.successfulParks = 0;
    }

    /**
     * 检查是否有动画正在播放
     */
    public isAnimating(): boolean {
        return this.isAnimationPlaying;
    }

    /**
     * 获取指定节点的位置策略
     */
    public getPositionStrategy(nodeName: string): CarPositionStrategy | null {
        return this.positionStrategies.get(nodeName) || null;
    }

    /**
     * 重置所有位置策略
     */
    private resetAllStrategies(): void {
        this.positionStrategies.forEach(strategy => {
            if (strategy.reset) {
                strategy.reset();
            }
        });
    }
}