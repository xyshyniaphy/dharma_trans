import {
    UseFiltersColumnOptions,
    UseFiltersColumnProps,
    UseFiltersInstanceProps,
    UseFiltersOptions,
    UseFiltersState,
    UseGlobalFiltersColumnOptions,
    UseGlobalFiltersInstanceProps,
    UseGlobalFiltersOptions,
    UseGlobalFiltersState
  } from 'react-table';
  
  declare module 'react-table' {
    // take this file as-is, or comment out the sections that don't apply to your plugin configuration
  
    export interface TableOptions<D extends object>
      extends UseFiltersOptions<D>,
        UseGlobalFiltersOptions<D>,
        // note that having Record here allows you to add anything to the options, this matches the spirit of the
        // underlying js library, but might be cleaner if it's replaced by a more specific type that matches your
        // feature set, like if it's a table option pass it in here.
        Record<string, any> {}
  
    export interface Hooks<D extends object = {}> {} // Add plugin hooks if needed
  
    export interface TableInstance<D extends object = {}>
      extends UseFiltersInstanceProps<D>,
        UseGlobalFiltersInstanceProps<D> {}
  
    export interface TableState<D extends object = {}>
      extends UseFiltersState<D>,
        UseGlobalFiltersState<D> {}
  
    export interface ColumnInterface<D extends object = {}>
      extends UseFiltersColumnOptions<D>,
        UseGlobalFiltersColumnOptions<D> {}
  
    export interface ColumnInstance<D extends object = {}>
      extends UseFiltersColumnProps<D> {}
  
    export interface Cell<D extends object = {}, V = any> {} // Add plugin cell props if needed
  
    export interface Row<D extends object = {}> {} // Add plugin row props if needed
  }
