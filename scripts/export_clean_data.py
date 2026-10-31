import subprocess
import json

def query_json_lines(sql):
    cmd = ['sudo', 'docker', 'exec', '-i', 'oracle-db', 'sqlplus', '-s', '/', 'as', 'sysdba']
    script = f'alter session set container = FREEPDB1;\nset pagesize 0;\nset linesize 4000;\nset feedback off;\nset trimspool on;\n{sql}\nexit;\n'
    res = subprocess.run(cmd, input=script, text=True, capture_output=True)
    items = []
    for line in res.stdout.splitlines():
        line = line.strip()
        if not line or line.startswith('Session altered') or line.startswith('SP2-'):
            continue
        try:
            items.append(json.loads(line, strict=False))
        except Exception as e:
            pass
    return items

# 1. Approval Hierarchies
print("Exporting Approval Hierarchies...")
sql1 = """
select json_object(
  'id' value id,
  'module' value module,
  'subsidiary' value subsidiary,
  'typeName' value type_name,
  'site' value site,
  'afdeling' value afdeling,
  'approverLevel' value approver_level,
  'userName' value user_name,
  'isActive' value is_active
) from DEV_SCHEMA.PIMS_APPROVAL_HIER order by id;
"""
data1 = query_json_lines(sql1)
with open('/tmp/approval_hier.json', 'w', encoding='utf-8') as f:
    json.dump(data1, f, indent=2)
print(f"Approval Hierarchies exported: {len(data1)} items")

# 2. User Informations (All unique users, IT000002 Mukti Assary first)
print("Exporting User Informations...")
sql2 = """
select json_object(
  'rowNo' value row_no,
  'nik' value C02,
  'nama' value C03,
  'manager' value C04,
  'subsidiary' value C05,
  'role' value C06,
  'aktif' value C07,
  'dibuatOleh' value C08,
  'tglDibuat' value C09,
  'diubahOleh' value C10,
  'tglDiubah' value C11,
  'rid' value row_no
) from (
  select row_no, C02, C03, C04, C05, C06, C07, C08, C09, C10, C11
  from DEV_SCHEMA.PIMS_GRID_DATA
  where page_alias = 'setup-user-informations-landing'
    and subsidiary_code = 'KYA'
  order by case when C02 = 'IT000002' then 0 else 1 end, row_no
);
"""
data2 = query_json_lines(sql2)
with open('/tmp/user_informations.json', 'w', encoding='utf-8') as f:
    json.dump(data2, f, indent=2)
print(f"User Informations exported: {len(data2)} items")

# 3. User Menus
print("Exporting User Menus...")
sql3 = """
select json_object(
  'rowNo' value row_no,
  'parentMenu' value C02,
  'namaMenu' value C03,
  'menuLink' value C04,
  'aktif' value C05,
  'dibuatOleh' value C06,
  'tglDibuat' value C07,
  'diubahOleh' value C08,
  'tglDiubah' value C09,
  'rid' value row_no
) from (
  select row_no, C02, C03, C04, C05, C06, C07, C08, C09
  from DEV_SCHEMA.PIMS_GRID_DATA
  where page_alias = 'setup-user-menus-landing'
    and subsidiary_code = 'KYA'
  order by row_no
);
"""
data3 = query_json_lines(sql3)
with open('/tmp/user_menus.json', 'w', encoding='utf-8') as f:
    json.dump(data3, f, indent=2)
print(f"User Menus exported: {len(data3)} items")

# 4. Roles
print("Exporting Roles...")
sql4 = """
select json_object(
  'roleId' value role_id,
  'roleName' value role_name,
  'roleStatus' value role_status,
  'descr' value descr
) from DEV_SCHEMA.HCM_ADM_ROLE order by role_name;
"""
data4 = query_json_lines(sql4)

sql4b = """
select json_object(
  'rowNo' value row_no,
  'roleName' value C02
) from (
  select distinct row_no, C02 from DEV_SCHEMA.PIMS_GRID_DATA
  where page_alias = 'role-management' and subsidiary_code = 'KYA'
  order by row_no
);
"""
data4b = query_json_lines(sql4b)

roles_obj = {
  "hcmRoles": data4,
  "managementRoles": data4b
}
with open('/tmp/roles.json', 'w', encoding='utf-8') as f:
    json.dump(roles_obj, f, indent=2)
print(f"Roles exported: {len(data4)} HCM roles, {len(data4b)} management roles")
