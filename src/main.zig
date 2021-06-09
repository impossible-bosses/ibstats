const std = @import("std");
const pageAllocator = std.heap.page_allocator;

const dom = @import("dom.zig");

export fn goodbye(x: c_int, y: c_int) c_int
{
    const hello = dom.hello(x, y);
    dom.importFunction(hello);
    return hello + 2;
}

comptime {
    @export(dom.hello, .{.name = "hello"});
}
