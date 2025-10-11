import { isInt } from "class-validator";

/**
 * 
 */
export interface JudgeGlobalConfig {
    @isInt()
    submisson_id: number;  
    @isInt()
    problem_id: number;  
    @
