#!/usr/bin/env python3
"""Ctrl+C proof for pnpm db:verify (foundation.md §F, "Feito quando").

Starts db:verify in its own process group, sends SIGINT to the whole group (what Ctrl+C in a
terminal does) once its log shows MARKER, and prints the project containers left afterwards.

  python3 packages/db/scripts/interrupt-test.py "== 1/6" /tmp/log.txt 12
"""
import os, signal, subprocess, sys, time
marker, log_path, extra_wait = sys.argv[1], sys.argv[2], float(sys.argv[3])
def containers():
    out = subprocess.run(["docker", "ps", "-a", "--filter", "name=supabase", "--format", "{{.Names}}"], capture_output=True, text=True).stdout
    return len(out.split())
with open(log_path, "w") as log:
    proc = subprocess.Popen(["pnpm", "db:verify"], stdout=log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, start_new_session=True)
    while proc.poll() is None and marker not in open(log_path).read():
        time.sleep(0.2)
    time.sleep(extra_wait)
    if proc.poll() is not None:
        print(f"marker {marker!r}: process already finished (exit {proc.returncode}); nothing proved"); sys.exit(1)
    before = containers()
    last = open(log_path).read().strip().splitlines()[-1]
    os.killpg(proc.pid, signal.SIGINT)
    t0 = time.time(); rc = proc.wait()
    print(f"SIGINT after {marker!r} (last log line: {last!r}): containers before={before}, "
          f"exit={rc}, containers after={containers()} (docker ps -a --filter name=supabase), {time.time() - t0:.0f} s to stop")
