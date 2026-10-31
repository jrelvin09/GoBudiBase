import subprocess
import json

def q(sql):
    cmd = ['sudo', 'docker', 'exec', '-i', 'oracle-db', 'sqlplus', '-s', '/', 'as', 'sysdba']
    script = f'alter session set container = FREEPDB1;\nset pagesize 0;\nset linesize 32000;\nset feedback off;\nset trimspool on;\nset long 2000000;\nset longchunksize 2000000;\n{sql}\nexit;\n'
    res = subprocess.run(cmd, input=script, text=True, capture_output=True)
    out = res.stdout.strip()
    lines = [l for l in out.splitlines() if not l.startswith('Session altered') and l.strip()]
    return '\n'.join(lines)

for p in [160, 161, 162, 163, 164, 432, 453]:
    print(f"=== PAGE {p} PLUGS ===")
    sql = f"""select json_arrayagg(json_object('name' value plug_name, 'type' value plug_source_type, 'source' value plug_source) returning clob) from APEX_240200.WWV_FLOW_PAGE_PLUGS where flow_id = 103 and page_id = {p};"""
    print(q(sql))

    print(f"=== PAGE {p} ITEMS ===")
    sql = f"""select json_arrayagg(json_object('name' value name, 'prompt' value prompt, 'display' value display_as, 'lov' value lov) returning clob) from APEX_240200.WWV_FLOW_STEP_ITEMS where flow_id = 103 and flow_step_id = {p};"""
    print(q(sql))
