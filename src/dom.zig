pub extern "other" fn importFunction(x: c_int) callconv(.C) void;

pub fn hello(x: c_int, y: c_int) callconv(.C) c_int
{
    return x + x * y;
}
