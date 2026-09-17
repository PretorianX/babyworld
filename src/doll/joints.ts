export type JointAngles = {
  torso: number
  head: number
  upperArmL: number
  lowerArmL: number
  upperArmR: number
  lowerArmR: number
  upperLegL: number
  lowerLegL: number
  upperLegR: number
  lowerLegR: number
}

export type JointPose = JointAngles & {
  rootX: number
  rootY: number
  rootRot: number
}

export const DEFAULT_POSE: JointPose = {
  rootX: 0,
  rootY: 0,
  rootRot: 0,
  torso: 0,
  head: 0,
  upperArmL: 10,
  lowerArmL: 5,
  upperArmR: -10,
  lowerArmR: -5,
  upperLegL: 5,
  lowerLegL: -5,
  upperLegR: -5,
  lowerLegR: 5,
}

export const JOINT_KEYS = [
  'torso',
  'head',
  'upperArmL',
  'lowerArmL',
  'upperArmR',
  'lowerArmR',
  'upperLegL',
  'lowerLegL',
  'upperLegR',
  'lowerLegR',
] as const satisfies ReadonlyArray<keyof JointAngles>

export const ROOT_KEYS = ['rootX', 'rootY', 'rootRot'] as const
