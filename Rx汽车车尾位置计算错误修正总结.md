# Rx汽车车尾位置计算错误修正总结

## 问题描述

在`CarManager.ts`文件中，多个方法中存在Rx汽车车尾位置计算错误的问题。由于Rx汽车的特殊性质（车头索引大于车尾索引），其车尾位置的计算公式应该是`tailMap = headMap - type + 1`，而不是通用的`tailMap = headMap + type - 1`。

## 错误原因

原先代码中，所有汽车都使用了相同的车尾位置计算公式：`tailMap = headMap + type - 1`，这个公式适用于Up和Left方向的汽车，但不适用于Rx汽车。

对于Rx汽车：
- 车头索引 > 车尾索引
- 正确的计算公式：`tailMap = headMap - type + 1`

对于Up和Left汽车：
- 车头索引 < 车尾索引
- 正确的计算公式：`tailMap = headMap + type - 1`

## 修正的方法和位置

### 1. moveCarRight方法（第1001行）
**修正前：**
```typescript
parkingInfo.tailMap = newHeadPosition + parkingInfo.type - 1;
```

**修正后：**
```typescript
parkingInfo.tailMap = newHeadPosition - parkingInfo.type + 1;
```

### 2. moveSimilarRightCarsWithHigherSortRight方法（第1344行）
**修正前：**
```typescript
carInfo.tailMap = newHeadPosition + carInfo.type - 1;
```

**修正后：**
```typescript
carInfo.tailMap = newHeadPosition - carInfo.type + 1;
```

### 3. moveSimilarRightCarsWithHigherSortLeft方法（第1229行）
**修正前：**
```typescript
carInfo.tailMap = nextHeadPosition + carInfo.type - 1;
```

**修正后：**
```typescript
carInfo.tailMap = nextHeadPosition - carInfo.type + 1;
```

## 未修正的方法（已确认正确）

### 1. calculateParkingInfo方法
该方法中Rx汽车的车尾位置计算已经是正确的：
```typescript
tailMap = headMap - type + 1
```

### 2. moveSimilarRightCarsWithLowerSortLeft方法
该方法中使用了正确的计算方式：
```typescript
carInfo.headMap = carInfo.tailMap - carInfo.type + 1;
```

## 影响和预期结果

修正这些错误后，Rx汽车在移动时的车尾位置计算将正确，特别是：

1. **停车状态判断正确**：汽车从停车场外进入停车场内时，能正确识别停车状态变化
2. **成功停车计数正确**：当Rx汽车从停车场外（包括负数位置）完全进入停车场内时，`successfulParks`计数能正确更新
3. **联动移动正确**：其他Rx汽车的联动移动位置计算也将正确

## 测试验证

在`lv2.ts`地图中，点击第4辆Rx汽车（初始位置：车头=-1, 车尾=-2）后，汽车移动到停车场内（车头=4, 车尾=3），成功停车数应该从0变为1。

修正前的错误计算会导致车尾位置为5（超出停车场范围），使得停车状态判断错误，成功停车数保持为0。

修正后的正确计算会使车尾位置为3（在停车场范围内），停车状态判断正确，成功停车数正确更新为1。