import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween } from 'cc';
import { MapData } from './MapData';
const { ccclass, property } = _decorator;

// 汽车位置策略接口
interface CarPositionStrategy {
    calculatePosition(sortIndex: number, type: number): Vec3;
    updateOffset(type: number): void;
}

// 汽车停放信息接口
interface CarParkingInfo {
    outerMap: string;
    sort: number;
    type: number;
    headMap: number;
    tailMap: number;
    node: Node;
}
// 定义汽车移动情况全局枚举
enum CarMovementStatus {
    CAN_MOVE_UP,
    CAN_MOVE_DOWN,
    CANNOT_MOVE,
    CAN_MOVE_DOWN_IN_PARK,
    CAN_MOVE_DOWN_OUT_PARK,
    PLAYING_ANIM
}

// 上方向汽车位置策略
class UpperCarPositionStrategy implements CarPositionStrategy {
    private offsetY: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        const posX = 0;
        const posY = this.offsetY;
        return new Vec3(posX, posY, 0);
    }

    updateOffset(type: number): void {
        this.offsetY -= 100 * type;
    }
}

// 左方向汽车位置策略
class LeftCarPositionStrategy implements CarPositionStrategy {
    private offsetX: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        const posX = this.offsetX;
        const posY = 0;
        return new Vec3(posX, posY, 0);
    }

    updateOffset(type: number): void {
        this.offsetX += 100 * type;
    }
}

// 右方向汽车位置策略
class RightCarPositionStrategy implements CarPositionStrategy {
    private offsetX: number = 0;

    calculatePosition(sortIndex: number, type: number): Vec3 {
        const posX = this.offsetX;
        const posY = 0;
        return new Vec3(posX, posY, 0);
    }

    updateOffset(type: number): void {
        this.offsetX -= 100 * type;
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

    private successfulParks: number = 0; // 成功停车计数
    private currentLevel: number = 1; // 当前关卡
    private positionStrategies: {[key: string]: CarPositionStrategy} = {};
    private nodeSortIndexes: {[key: string]: number} = {};
    private carParkingInfos: CarParkingInfo[] = []; // 存储所有汽车的停放信息
    private carAnimDuration: number = 0.5; // 汽车动画播放时间

    // 初始化汽车
    public initCars(level: number): void {
        this.currentLevel = level;
        this.successfulParks = 0;
        this.carParkingInfos = []; // 清空汽车停放信息
        console.log('成功停车计数已重置为0');

        if (!this.nodeCar) {
            console.error('nodeCar is not assigned in CarManager. Please assign the nodeCar property in the inspector.');
            return;
        }

        // 初始化节点名称列表
        const nodeNames = ['nodeU0', 'nodeU1', 'nodeU2', 'nodeU3', 'nodeU4', 'nodeL0', 'nodeL1', 'nodeL2', 'nodeL3', 'nodeL4', 'nodeL5', 'nodeR0', 'nodeR1', 'nodeR2', 'nodeR3', 'nodeR4', 'nodeR5'];

        // 清除现有汽车并初始化策略和索引
        this.clearExistingCars(nodeNames);
        this.initializeStrategiesAndIndexes(nodeNames);

        // 获取当前关卡的汽车数据
        const carData = MapData.getCarDataByLevel(level);
        if (!carData || carData.length === 0) {
            console.log(`No car data for level ${level}`);
            return;
        }

        // 创建汽车
        for (const car of carData) {
            this.createCar(car);
        }
    }

    // 清除现有汽车
    private clearExistingCars(nodeNames: string[]): void {
        for (const nodeName of nodeNames) {
            const node = this.nodeCar.getChildByName(nodeName);
            if (node) {
                node.removeAllChildren();
            } else {
                console.warn(`Cannot find node ${nodeName} under nodeCar`);
            }
        }
    }

    // 初始化位置策略和节点索引
    private initializeStrategiesAndIndexes(nodeNames: string[]): void {
        this.positionStrategies = {};
        this.nodeSortIndexes = {};

        for (const nodeName of nodeNames) {
            this.nodeSortIndexes[nodeName] = 0;

            if (nodeName.includes('U')) {
                this.positionStrategies[nodeName] = new UpperCarPositionStrategy();
            } else if (nodeName.includes('L')) {
                this.positionStrategies[nodeName] = new LeftCarPositionStrategy();
            } else if (nodeName.includes('R')) {
                this.positionStrategies[nodeName] = new RightCarPositionStrategy();
            }
        }
    }

    // 创建单个汽车
    private createCar(car: {outerMap: string, sort: number, type: number}): void {
        const {outerMap, sort, type} = car;
        const nodeName = `node${outerMap}`; // 例如: nodeU0
        const parentNode = this.nodeCar.getChildByName(nodeName);

        if (!parentNode) {
            console.error(`Cannot find parent node: ${nodeName} under nodeCar`);
            return;
        }

        // 获取对应的汽车预制
        const carPrefab = this.getCarPrefab(outerMap, type);
        if (!carPrefab) {
            return;
        }

        // 创建汽车实例
        const carNode = instantiate(carPrefab);
        if (!carNode) {
            console.error(`Failed to instantiate car prefab for type ${type}`);
            return;
        }

        // 设置父节点
        parentNode.addChild(carNode);

        // 更新排序索引
        this.nodeSortIndexes[nodeName]++;
        console.log(`Created car type ${type} at ${nodeName}, sort: ${this.nodeSortIndexes[nodeName]}`);

        // 设置汽车位置
        this.setCarPosition(nodeName, carNode, type);

        // 计算并存储汽车停放信息
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        let headMap = 0;
        let tailMap = 0;

        if (outerMap.startsWith('U')) {
            // Ux汽车，假设地图是垂直方向，所以headMap是地图高度-1，tailMap是headMap+type-1
            const mapH = mapData.MapH;
            headMap = mapH; 
            tailMap = headMap + type - 1;
        } else if (outerMap.startsWith('L')) {
            // Lx汽车
            const mapW = mapData.MapW;
            headMap = mapW;
            tailMap = headMap + type - 1;
        } else if (outerMap.startsWith('R')) {
            // Rx汽车
            headMap = -1;
            tailMap = headMap - type + 1;
        }

        // 考虑sort位置
        if (sort > 0) {
            if (outerMap.startsWith('U')) {
                // 上方向汽车，sort越大越靠下
                const prevInfo = this.carParkingInfos.find(info => info.outerMap === outerMap && info.sort === sort - 1);
                if (prevInfo) {
                    headMap = prevInfo.tailMap + 1;
                    tailMap = headMap + type - 1;
                }
            } else if (outerMap.startsWith('L')) {
                // 左方向汽车，sort越大越靠右
                const prevInfo = this.carParkingInfos.find(info => info.outerMap === outerMap && info.sort === sort - 1);
                if (prevInfo) {
                    headMap = prevInfo.tailMap + 1;
                    tailMap = headMap + type - 1;
                }
            } else if (outerMap.startsWith('R')) {
                // 右方向汽车，sort越大越靠左
                const prevInfo = this.carParkingInfos.find(info => info.outerMap === outerMap && info.sort === sort - 1);
                if (prevInfo) {
                    headMap = prevInfo.tailMap - 1;
                    tailMap = headMap - type + 1;
                }
            }
        }

        // 存储汽车停放信息
        const parkingInfo = {
            outerMap,
            sort,
            type,
            headMap,
            tailMap,
            node: carNode
        };
        this.carParkingInfos.push(parkingInfo);
        console.log('存储汽车停放信息:', parkingInfo);

        // 设置汽车点击事件
        this.setupCarClickEvents(carNode, parentNode, type, sort);
    }

    // 获取汽车预制体
    private getCarPrefab(outerMap: string, type: number): Prefab | null {
        // 根据outerMap和type选择不同系列的预制体
        if (outerMap.startsWith('U')) {
            switch (type) {
                case 1: return this.itemCarU1;
                case 2: return this.itemCarU2;
                case 3: return this.itemCarU3;
                default: console.error(`Invalid car type: ${type}`); return null;
            }
        } else if (outerMap.startsWith('L')) {
            switch (type) {
                case 1: return this.itemCarL1;
                case 2: return this.itemCarL2;
                case 3: return this.itemCarL3;
                default: console.error(`Invalid car type: ${type}`); return null;
            }
        } else if (outerMap.startsWith('R')) {
            switch (type) {
                case 1: return this.itemCarR1;
                case 2: return this.itemCarR2;
                case 3: return this.itemCarR3;
                default: console.error(`Invalid car type: ${type}`); return null;
            }
        } else {
            console.error(`Invalid outerMap: ${outerMap}`);
            return null;
        }
    }

    // 设置汽车位置
    private setCarPosition(nodeName: string, carNode: Node, type: number): void {
        const strategy = this.positionStrategies[nodeName];
        if (!strategy) {
            console.error(`No position strategy found for node: ${nodeName}`);
            return;
        }

        const sortIndex = this.nodeSortIndexes[nodeName];
        const position = strategy.calculatePosition(sortIndex, type);
        carNode.setPosition(position);
        console.log(`设置${nodeName.charAt(4)}系列汽车位置: (${position.x}, ${position.y})`);

        // 更新偏移量
        strategy.updateOffset(type);
    }

    // 设置汽车点击事件
    private setupCarClickEvents(carNode: Node, parentNode: Node, type: number, sort: number) {
        // 为汽车添加触摸点击事件
        carNode.on(Node.EventType.TOUCH_END, () => {
                this.handleCarClick(carNode, parentNode, type, sort);
            }, this);

        // 为汽车添加鼠标点击事件（用于桌面平台）
        // carNode.on(Node.EventType.MOUSE_UP, () => {
        //         this.handleCarClick(carNode, parentNode, type, sort);
        //     }, this);
    }

    // 处理汽车点击逻辑
    private isAnimationPlaying: boolean = false;

    private handleCarClick(carNode: Node, parentNode: Node, type: number, sort: number) {
        // 如果有汽车正在播放动画，则不响应点击
        if (this.isAnimationPlaying) {
            console.log(`有汽车正在播放动画，当前点击不响应`);
            return;
        }

        // 获取汽车世界坐标
        const worldPos = carNode.worldPosition;

        // 获取当前关卡地图数据
        const mapData = MapData.getMapDataByLevel(this.currentLevel);
        const mapInfo = mapData ? JSON.stringify(mapData.Map) : '无地图数据';

        const outerMap = parentNode.name.replace('node', '');

        // 查找汽车停放信息
        const parkingInfo = this.carParkingInfos.find(info => 
            info.outerMap === outerMap && 
            info.sort === sort && 
            info.type === type
        );

        // 打印所需信息
        console.log(`汽车被点击!`);
        console.log(`- 父节点: ${parentNode.name}`);
        console.log(`- type: ${type}`);
        console.log(`- sort: ${sort}`);
        console.log(`- 世界坐标: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`);
        console.log(`- map: ${mapInfo}`);
        if (parkingInfo) {
            console.log(`- 车头位置: ${parkingInfo.headMap}`);
            console.log(`- 车尾位置: ${parkingInfo.tailMap}`);

            // 根据汽车类型进行不同处理
            if (outerMap.startsWith('U')) {
                console.log(`汽车属于下方`);
                // 从outerMap中提取数字部分作为x坐标（例如从'U1'提取'1'）
                const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
                console.log(`Ux汽车的x坐标从outerMap提取: ${x}`);
                const mapH = mapData.MapH;
                const map = mapData.Map;

                // 可以通过位置策略获取汽车位置
                const nodeName = `node${outerMap}`;
                const strategy = this.positionStrategies[nodeName];
                if (strategy) {
                    const pos = strategy.calculatePosition(sort, type);
                    console.log(`通过位置策略获取的汽车位置: (${pos.x}, ${pos.y})`);
                }

                // 检查是否可以向上开
                console.log(`parkingInfo.headMap: ${parkingInfo.headMap}, x: ${x}`);
                // 确保索引在有效范围内
                const rowIndex = parkingInfo.headMap - 1;
                const colIndex = x;
                // 检查行和列索引是否有效
                if (rowIndex >= 0 && rowIndex < map.length && colIndex >= 0 && colIndex < map[rowIndex].length) {
                    console.log(`map[${rowIndex}][${colIndex}]: ${map[rowIndex][colIndex]}`);
                } else {
                    console.log(`索引越界: row=${rowIndex}, col=${colIndex}, 有效范围: 行[0-${map.length-1}], 列[0-${map[0]?.length-1}]`);
                }
                console.log(`整个map数据: ${JSON.stringify(map)}`);

                // 使用临时变量存储条件判断结果
                const cannotMoveUp = parkingInfo.headMap === 0 || (rowIndex >= 0 && rowIndex < map.length && colIndex >= 0 && colIndex < map[rowIndex].length && map[rowIndex][colIndex] !== 0);
                const tailRowIndex = parkingInfo.tailMap + 1;
                const cannotMoveDown = parkingInfo.headMap < 0 || (tailRowIndex < mapH && tailRowIndex >= 0 && x >= 0 && x < map[tailRowIndex].length && map[tailRowIndex][x] !== 0);

                // 确定汽车移动状态
                let movementStatus: CarMovementStatus;
                if (cannotMoveUp && cannotMoveDown) {
                    movementStatus = CarMovementStatus.CANNOT_MOVE;
                } else if (cannotMoveUp) {
                    movementStatus = CarMovementStatus.CAN_MOVE_DOWN;
                } else {
                    movementStatus = CarMovementStatus.CAN_MOVE_UP;
                }

                // 根据移动状态执行不同逻辑
                if (movementStatus === CarMovementStatus.CANNOT_MOVE) {
                    console.log(`汽车既不可以向上开也不可以向下开`);
                } else if (movementStatus === CarMovementStatus.CAN_MOVE_DOWN) {
                    console.log(`汽车可以向下开`);
                    let carStopsOutside = true;

                    // 检查车尾+1到mapH-1的位置
                    for (let index = parkingInfo.tailMap + 1; index < mapH; index++) {
                        if (index >= 0 && index < map.length && x >= 0 && x < map[index].length && map[index][x] !== 0) {
                            console.log(`车尾会停在${index - 1}`);
                            console.log(`汽车会停在停车场里边，被停车场里的车或雪糕桶挡下来。`);
                            carStopsOutside = false;
                            break;
                        }
                    }

                    if (carStopsOutside) {
                        console.log(`Ux的汽车会停在停车场外，和Ux相同且Sort比它大的车一起撤出停车场。`);
                    }
                } else {
                    console.log(`汽车可以向上开`);
                    let newHeadPos = parkingInfo.headMap - 1;

                    // 寻找新的车头位置
                    for (let index = parkingInfo.headMap - 1; index >= 0; index--) {
                        if (index >= 0 && index < map.length && x >= 0 && x < map[index].length && map[index][x] !== 0) {
                            break;
                        }
                        newHeadPos = index;
                    }

                    console.log(`车头会停在${newHeadPos}`);
                }
            } else if (outerMap.startsWith('R')) {
                console.log(`汽车属于左方`);
                // Rx汽车的逻辑，暂不细分
            } else if (outerMap.startsWith('L')) {
                console.log(`汽车属于右方`);
                // Lx汽车的逻辑，暂不细分
            }

            // 更新汽车数据、地图数据，播放动画
            if (outerMap.startsWith('U')) {
                // 从outerMap中提取数字部分作为x坐标（例如从'U1'提取'1'）
                const x = parseInt(outerMap.replace(/[^0-9]/g, ''), 10);
                console.log(`Ux汽车的x坐标从outerMap提取: ${x}`);
                const mapH = mapData.MapH;
                const map = mapData.Map;
                let carStopsOutside = true;
                let index = parkingInfo.tailMap + 1;
                let newHeadPos = parkingInfo.headMap - 1;

                // 使用之前定义的移动状态
                const rowIndex = parkingInfo.headMap - 1;
                const cannotMoveUp = parkingInfo.headMap === 0 || (rowIndex >= 0 && rowIndex < map.length && x >= 0 && x < map[rowIndex].length && map[rowIndex][x] !== 0);
                const tailRowIndex = parkingInfo.tailMap + 1;
                const cannotMoveDown = parkingInfo.headMap < 0 || (tailRowIndex < mapH && tailRowIndex >= 0 && x >= 0 && x < map[tailRowIndex].length && map[tailRowIndex][x] !== 0);

                let movementStatus: CarMovementStatus;
                if (cannotMoveUp && cannotMoveDown) {
                    movementStatus = CarMovementStatus.CANNOT_MOVE;
                } else if (cannotMoveUp) {
                    movementStatus = CarMovementStatus.CAN_MOVE_DOWN;
                } else {
                    movementStatus = CarMovementStatus.CAN_MOVE_UP;
                }

                if (movementStatus === CarMovementStatus.CAN_MOVE_DOWN) {
                    // 可以向下开
                    if (tailRowIndex === mapH - 1 && (tailRowIndex >= 0 && tailRowIndex < map.length && x >= 0 && x < map[tailRowIndex].length && map[tailRowIndex][x] === 0)) {
                        // 检查车尾+1到mapH-1的位置
                        carStopsOutside = true;
                        for (index = parkingInfo.tailMap + 1; index < mapH; index++) {
                            if (index >= 0 && index < map.length && x >= 0 && x < map[index].length && map[index][x] !== 0) {
                                carStopsOutside = false;
                                break;
                            }
                        }

                        if (carStopsOutside) {
                            // 汽车停在停车场外，需要撤出
                            console.log(`Ux汽车撤出停车场`);
                            // 1. 更新汽车停放信息
                            parkingInfo.headMap = parkingInfo.tailMap + 1;
                            parkingInfo.tailMap = mapH - 1;
                            // 2. 更新地图数据（将原位置设为0）
                            for (let i = parkingInfo.headMap - type; i < parkingInfo.headMap; i++) {
                                if (i >= 0 && i < map.length && x >= 0 && x < map[i].length) {
                                    map[i][x] = 0;
                                }
                            }
                            // 3. 移动动画
                            // 设置动画播放标志
                            this.isAnimationPlaying = true;
                            // 计算移动距离 (增加调试信息)
                            const moveDistance = -100 * (parkingInfo.tailMap - parkingInfo.headMap + 1);
                            console.log(`汽车移动距离: ${moveDistance}`);
                            console.log(`动画目标位置: (${carNode.position.x}, ${carNode.position.y + moveDistance}, ${carNode.position.z})`);
                            // 移动动画
                            this.moveCarAnimation(carNode, new Vec3(0, moveDistance, 0), this.carAnimDuration, () => {
                                // 动画结束后重置标志
                                this.isAnimationPlaying = false;
                                console.log(`动画播放完成，重置动画标志`);
                            });
                        } else {
                            // 汽车停在停车场内
                            console.log(`Ux汽车向下移动到新位置`);
                            // 1. 更新汽车停放信息
                            const oldHead = parkingInfo.headMap;
                            parkingInfo.headMap = parkingInfo.tailMap + 1;
                            parkingInfo.tailMap = index - 1;
                            // 2. 更新地图数据
                            for (let i = oldHead; i <= parkingInfo.tailMap; i++) {
                                if (i >= 0 && i < map.length && x >= 0 && x < map[i].length) {
                                    if (i < oldHead + type) {
                                        map[i][x] = 0; // 清除原位置
                                    }
                                    if (i >= parkingInfo.headMap && i <= parkingInfo.tailMap) {
                                        map[i][x] = type; // 设置新位置
                                    }
                                }
                            }
                            // 3. 移动动画
                            // 设置动画播放标志
                            this.isAnimationPlaying = true;
                            // 移动动画
                            this.moveCarAnimation(carNode, new Vec3(0, -100 * (parkingInfo.headMap - oldHead), 0), this.carAnimDuration, () => {
                                // 动画结束后重置标志
                                this.isAnimationPlaying = false;
                            });
                        }
                    }
                } else if (movementStatus === CarMovementStatus.CAN_MOVE_UP) {
                    // 可以向上开
                    console.log(`Ux汽车向上移动到新位置`);
                    // 寻找新的车头位置
                    newHeadPos = parkingInfo.headMap - 1;
                    for (index = parkingInfo.headMap - 1; index >= 0; index--) {
                        if (index >= 0 && index < map.length && x >= 0 && x < map[index].length && map[index][x] !== 0) {
                            break;
                        }
                        newHeadPos = index;
                    }

                    // 1. 更新汽车停放信息
                    const oldHead = parkingInfo.headMap;
                    parkingInfo.headMap = newHeadPos;
                    parkingInfo.tailMap = newHeadPos + type - 1;
                    // 2. 更新地图数据
                    for (let i = newHeadPos; i <= oldHead + type - 1; i++) {
                        if (i >= 0 && i < map.length && x >= 0 && x < map[i].length) {
                            if (i >= newHeadPos && i <= parkingInfo.tailMap) {
                                map[i][x] = type; // 设置新位置
                            } else {
                                map[i][x] = 0; // 清除原位置
                            }
                        }
                    }
                    // 3. 移动动画
                    // 设置动画播放标志
                    this.isAnimationPlaying = true;
                    // 移动动画
                    this.moveCarAnimation(carNode, new Vec3(0, 100 * (oldHead - newHeadPos), 0), this.carAnimDuration, () => {
                        // 动画结束后重置标志
                        this.isAnimationPlaying = false;
                    });
                }
            }
            // Rx和Lx汽车的逻辑将在后续实现
        
        } else {
            console.log(`- 未找到停放信息`);
        }
    }

    // 汽车移动动画
    private moveCarAnimation(carNode: Node, targetOffset: Vec3, duration: number, onComplete?: () => void): void {
        const targetPos = carNode.position.clone().add(targetOffset);
        const tweenAction = tween(carNode)
            .to(duration, { position: targetPos });

        if (onComplete) {
            tweenAction.call(onComplete);
        }

        tweenAction.start();
    }

    // 增加成功停车计数
    public incrementSuccessfulPark(): void {
        this.successfulParks++;
        console.log(`成功停车计数增加到: ${this.successfulParks}`);
    }

    // 获取成功停车计数
    public getSuccessfulParks(): number {
        return this.successfulParks;
    }

    // 设置当前关卡
    public setCurrentLevel(level: number): void {
        this.currentLevel = level;
    }

    // 获取当前关卡
    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    // 根据outerMap和sort获取汽车停放信息
    public getCarParkingInfo(outerMap: string, sort: number): CarParkingInfo | null {
        return this.carParkingInfos.find(info => info.outerMap === outerMap && info.sort === sort);
    }
}