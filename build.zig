const std = @import("std");
const Builder = std.build.Builder;

const CopyDirError = error {
    IteratorError,
    CopyFileError,
    OpenSrcDirError,
    OpenDstDirError,
    MakeDstDirError,
    UnhandledFileType
};

fn copyDirRecursive_(src: std.fs.Dir, dst: std.fs.Dir) CopyDirError!void
{
    var srcIt = src.iterate();
    while (true) {
        const entryOpt = srcIt.next() catch {
            return CopyDirError.IteratorError;
        };
        if (entryOpt) |entry| {
            switch (entry.kind) {
                std.fs.File.Kind.File => {
                    src.copyFile(entry.name, dst, entry.name, .{}) catch {
                        return CopyDirError.CopyFileError;
                    };
                },
                std.fs.File.Kind.Directory => {
                    var srcSubdir = src.openDir(entry.name, .{.iterate = true}) catch {
                        return CopyDirError.OpenSrcDirError;
                    };
                    defer srcSubdir.close();

                    dst.makeDir(entry.name) catch {
                        return CopyDirError.MakeDstDirError;
                    };
                    var dstSubdir = dst.openDir(entry.name, .{}) catch {
                        return CopyDirError.OpenDstDirError;
                    };
                    defer dstSubdir.close();

                    try copyDirRecursive_(srcSubdir, dstSubdir);
                },
                else => {
                    return CopyDirError.UnhandledFileType;
                }
            }
        }
        else {
            break;
        }
    }
}

fn copyDirRecursive(srcPath: []const u8, dstPath: []const u8) !void
{
    const cwd = std.fs.cwd();
    try cwd.deleteTree(dstPath);
    try cwd.makePath(dstPath);

    var srcDir = try cwd.openDir(srcPath, .{.iterate = true});
    defer srcDir.close();
    var dstDir = try cwd.openDir(dstPath, .{});
    defer dstDir.close();
    try copyDirRecursive_(srcDir, dstDir);
}

pub fn build(b: *Builder) void {
    //copyDirRecursive("public", "build/public") catch unreachable;

    const target = std.zig.CrossTarget {
        .cpu_arch = std.Target.Cpu.Arch.wasm32,
        .os_tag = std.Target.Os.Tag.freestanding
    };
    const mode = b.standardReleaseOptions();

    const lib = b.addSharedLibrary("ibstats", "src/main.zig", .unversioned);
    lib.setTarget(target);
    lib.setBuildMode(mode);
    lib.setOutputDir("public/wasm");
    lib.install();
}
